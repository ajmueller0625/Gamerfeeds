import re
import requests
import openai
from newspaper import Article
from requests import RequestException


class NewsDataHandler:
    def __init__(self, api_key: str, openai_key: str, query: str, domains: str, sortBy: str = 'publishedAt', language: str = 'en', pageSize: int = 100):
        self.api_key = api_key
        self.openai_key = openai_key
        self.query = query
        self.domains = domains
        self.sortBy = sortBy
        self.language = language
        self.pageSize = pageSize

    # Method for fetching news data using NewsAPI
    def fetch_game_news(self) -> list:
        try:
            url = "https://newsapi.org/v2/everything"
            params = {
                'q': self.query,
                'domains': self.domains,
                'language': self.language,
                'sortBy': self.sortBy,
                'apiKey': self.api_key,
                'pageSize': self.pageSize
            }

            response = requests.get(url=url, params=params)
            if response.status_code == 200:
                news_data = response.json()
                return news_data.get('articles', [])

        except RequestException as e:
            raise RequestException(
                f'Request failed when fetching news data: {e}')

    # A utility method that fetches article data from a raw html from a given url
    def get_content_data(self, url: str) -> str:
        try:
            article = Article(url)
            article.download()
            article.parse()
            return article.text

        except RequestException as e:
            raise RequestException(f'Request failed fetching raw html: {e}')

    # Method that uses OpenAI to extract the main article content
    def get_clean_article(self, content: str) -> str:
        prompt = (
            '''
            Extract the main content, remove video and photograph references, and remove unnecessary text. 
            Add html elements if it is needed but exclude <html>, <head> and <body> because 
            it is going to be used later inside an html <p> element.
            '''
            f'{content[:4000]}'  # Limit input length for GPT processing
        )

        try:
            client = openai.OpenAI(api_key=self.openai_key)
            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[{'role': 'user', 'content': prompt}]
            )

            return response.choices[0].message.content.strip()

        except openai.error.OpenAIError as e:
            raise RuntimeError(f'OpenAI API error: {e}')

    # A test method that exports data to a json file
    def export_news_data(self, articles: list) -> list:
        cleaned_data = []

        for article in articles:
            # Check if the string contains parentheses
            if '(' in article['author'] and ')' in article['author']:
                # Use regex to extract the name inside parentheses
                pattern = r'\((.*?)\)'
                author = re.search(pattern, article['author'])
                article['author'] = author.group(1)

            article['sourceName'] = article['source']['name']
            content = self.get_content_data(article['url'])
            article['content'] = self.get_clean_article(content)
            del article['source']
            cleaned_data.append(article)

        return cleaned_data
