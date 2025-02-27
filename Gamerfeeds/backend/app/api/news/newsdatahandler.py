import requests
import json
import openai
from os import getenv
from dotenv import load_dotenv
from newspaper import Article
from requests import RequestException


class NewsDataHandler:
    def __init__(self, api_key: str, openai_key: str):
        self.api_key = api_key
        self.openai_key = openai_key

    # Method for fetching news data using NewsAPI
    def fetch_game_news(self) -> list:
        try:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": "gaming OR video games",
                "domains": "ign.com,kotaku.com,polygon.com,gamespot.com,pcgamer.com,gameinformer.com",
                "language": "en",
                "sortBy": "publishedAt",
                "apiKey": self.api_key
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
            "Extract the main article content and remove unnecessary text"
            f"{content[:4000]}"  # Limit input length for GPT processing
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
    def export_news_data(self, articles: list) -> None:
        cleaned_data = []

        for article in articles:
            article['sourceName'] = article['source']['name']
            content = self.get_content_data(article['url'])
            article['content'] = self.get_clean_article(content)
            del article['source']
            cleaned_data.append(article)

        try:
            with open('news/newsApi.json', 'w', encoding='utf-8') as json_file:
                json.dump(cleaned_data, json_file, indent=4)
            print('News data successfully saved.')
        except IOError as e:
            raise RuntimeError(f'Error writing data to JSON file: {e}')


if __name__ == '__main__':
    load_dotenv()
    api_key = getenv('NEWS_API_KEY')
    openai_key = getenv('OPENAI_KEY')

    newsData = NewsDataHandler(api_key=api_key, openai_key=openai_key)
    articles = newsData.fetch_game_news()
    newsData.export_news_data(articles=articles)
