import re
import asyncio
import requests
import openai
from newspaper import Article
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional
from requests import RequestException
from tenacity import retry, stop_after_attempt, wait_exponential


class NewsDataHandler:
    def __init__(self, api_key: str, openai_key: str, query: str, domains: str,
                 sortBy: str = 'publishedAt', language: str = 'en', pageSize: int = 100,
                 max_workers: int = 5, max_retries: int = 3):
        """
        Initialize the NewsDataHandler.

        Args:
            api_key: NewsAPI key
            openai_key: OpenAI API key
            query: Search query for news
            domains: Comma-separated list of domains to search
            sortBy: How to sort results ('publishedAt', 'relevancy', 'popularity')
            language: Language code
            pageSize: Number of results to fetch
            max_workers: Maximum number of concurrent workers for processing
            max_retries: Maximum number of retries for failed requests
        """
        self.api_key = api_key
        self.openai_key = openai_key
        self.query = query
        self.domains = domains
        self.sortBy = sortBy
        self.language = language
        self.pageSize = pageSize
        self.max_workers = max_workers
        self.max_retries = max_retries
        self.openai_client = openai.OpenAI(api_key=self.openai_key)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_news_articles(self) -> List[Dict[str, Any]]:
        """
        Fetch news articles from NewsAPI with retry logic.

        Returns:
            List of article dictionaries
        """
        url = 'https://newsapi.org/v2/everything'
        params = {
            'q': self.query,
            'domains': self.domains,
            'language': self.language,
            'sortBy': self.sortBy,
            'apiKey': self.api_key,
            'pageSize': self.pageSize
        }

        try:
            response = requests.get(url=url, params=params, timeout=10)
            response.raise_for_status()
            news_data = response.json()
            return news_data.get('articles', [])
        except RequestException as e:
            raise RequestException(f'Failed to fetch news data: {e}')

    async def fetch_article_content_async(self, url: str) -> Optional[str]:
        """
        Asynchronously fetch article content using newspaper3k.

        Args:
            url: URL of the article

        Returns:
            Extracted article text or None on failure
        """
        try:
            # Create a thread for newspaper3k since it's not async-compatible
            with ThreadPoolExecutor() as executor:
                article_text = await asyncio.get_event_loop().run_in_executor(
                    executor, self._extract_article_text, url
                )
            return article_text
        except Exception as e:
            print(f"Error fetching content from {url}: {e}")
            return None

    def _extract_article_text(self, url: str) -> str:
        """
        Extract article text using newspaper3k (runs in thread).

        Args:
            url: URL of the article

        Returns:
            Extracted article text
        """
        article = Article(url)
        article.download()
        article.parse()
        return article.text

    async def clean_article_content_async(self, content: str) -> str:
        """
        Asynchronously clean article content using OpenAI.

        Args:
            content: Raw article content

        Returns:
            Cleaned article content
        """
        if not content:
            return ""

        prompt = (
            '''
            Extract the main content, remove video and photograph references, 
            and remove unnecessary text, white spaces and line breaks.
            '''
            f'{content[:4000]}'  # Limit input length for GPT processing
        )

        try:
            # Use executor to run OpenAI call (not natively async)
            with ThreadPoolExecutor() as executor:
                response = await asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: self.openai_client.chat.completions.create(
                        model='gpt-4o-mini',
                        messages=[{'role': 'user', 'content': prompt}]
                    )
                )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI processing error: {e}")
            # Fall back to a basic cleanup if OpenAI fails
            return self._basic_content_cleanup(content)

    def _extract_author_name(self, author_field: str) -> str:
        """
        Extract clean author name from the author field.

        Args:
            author_field: Raw author field from NewsAPI

        Returns:
            Cleaned author name
        """
        if not author_field:
            return ""

        # Extract name from parentheses if present
        if '(' in author_field and ')' in author_field:
            pattern = r'\((.*?)\)'
            match = re.search(pattern, author_field)
            if match:
                return match.group(1)

        return author_field

    async def process_articles(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process a batch of articles asynchronously.

        Args:
            articles: List of article dictionaries from NewsAPI

        Returns:
            List of processed article dictionaries with valid content only
        """
        processed_articles = []
        tasks = []

        # Create tasks for concurrent processing
        for article in articles:
            # Clean up article structure first
            processed_article = {
                'title': article.get('title', ''),
                'author': self._extract_author_name(article.get('author', '')),
                'description': article.get('description', ''),
                'url': article.get('url', ''),
                'urlToImage': article.get('urlToImage', ''),
                'publishedAt': article.get('publishedAt', ''),
                'sourceName': article.get('source', {}).get('name', '')
            }

            # Add task for content fetching and processing
            task = asyncio.create_task(
                self._process_single_article(processed_article))
            tasks.append((processed_article, task))

        # Wait for all tasks and collect results
        for processed_article, task in tasks:
            try:
                content = await task
                if content and content.strip():  # Ensure content exists and isn't just whitespace
                    processed_article['content'] = content
                    processed_articles.append(processed_article)
                else:
                    print(
                        f"Skipping article '{processed_article['title']}': Empty content")
            except Exception as e:
                print(
                    f"Error processing article '{processed_article['title']}': {e}")

        return processed_articles

    async def _process_single_article(self, article: Dict[str, Any]) -> str:
        """
        Process a single article - fetch and clean content.

        Args:
            article: Article dictionary

        Returns:
            Cleaned article content
        """
        raw_content = await self.fetch_article_content_async(article['url'])
        if raw_content:
            return await self.clean_article_content_async(raw_content)
        return ""

    async def process_news_data_async(self) -> List[Dict[str, Any]]:
        """
        Main method to fetch and process news data asynchronously.

        Returns:
            List of processed articles
        """
        # Fetch articles (not async since NewsAPI doesn't benefit much from async here)
        articles = self.fetch_news_articles()

        # Process articles asynchronously
        return await self.process_articles(articles)

    def process_news_data(self) -> List[Dict[str, Any]]:
        """
        Synchronous wrapper for the async processing method.

        Returns:
            List of processed articles
        """
        return asyncio.run(self.process_news_data_async())
