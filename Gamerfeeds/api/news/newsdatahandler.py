import requests
import json
from os import getenv
from dotenv import load_dotenv
from requests import RequestException


class NewsDataHandler:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def fetch_game_news(self) -> None:
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

        except RequestException as e:
            raise RequestException(
                f'Request failed when fetching news data: {e}')

        else:
            if response.status_code == 200:
                news_data = response.json()
                self.export_news_data(news_data)

    def export_news_data(self, data: list) -> None:
        try:
            with open('news/newsApi.json', 'w', encoding='utf-8') as json_file:
                json.dump(data, json_file, indent=4)
            print('News data successfully saved.')
        except IOError as e:
            raise RuntimeError(f'Error writing data to JSON file: {e}')


if __name__ == '__main__':
    load_dotenv()
    api_key = getenv('NEWS_API_KEY')
    newsData = NewsDataHandler(api_key=api_key)
    newsData.fetch_game_news()
