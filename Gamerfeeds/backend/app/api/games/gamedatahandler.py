from os import getenv
from dotenv import load_dotenv
import requests
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from requests import RequestException


class GameDataHandler:
    def __init__(self, client_id: str, client_secret: str) -> None:
        """
        Initialize the GameDataHandler.

        Args:
            client_id (str): Your Twitch client ID
            client_secret (str): Your Twitch client secret
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.games_url = 'https://api.igdb.com/v4/games'
        self.access_token = None
        self.token_expiration = None

    def _authenticate(self) -> None:
        """
        Authenticate with the Twitch API to get an access token for IGDB.
        Checks if existing token is valid before requesting a new one.

        Raises:
            RequestException: if authentication request fails
        """
        # Check if we already have a valid token
        if self.access_token and self.token_expiration and datetime.now() < self.token_expiration:
            return

        auth_url = 'https://id.twitch.tv/oauth2/token'
        payload = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'client_credentials'
        }

        try:
            response = requests.post(url=auth_url, data=payload)
            response.raise_for_status()

            data = response.json()
            self.access_token = data['access_token']
            # Set expiration time (subtract 1 day as buffer)
            self.token_expiration = datetime.now(
            ) + timedelta(seconds=data['expires_in'] - 86400)
        except Exception as e:
            raise RequestException(f'Authentication failed: {str(e)}')

    def _make_api_request(self, query: str) -> List[Dict[str, Any]]:
        """
        Make a request to the IGDB Games API.

        Args:
            query (str): The query to send to the API

        Returns:
            List[Dict[str, Any]]: The API response data

        Raises:
            RequestException: if the request fails
        """
        self._authenticate()

        headers = {
            'Client-ID': self.client_id,
            'Authorization': f'Bearer {self.access_token}',
            'Accept': 'application/json'
        }

        try:
            response = requests.post(
                url=self.games_url, headers=headers, data=query)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise RequestException(f'Query failed: {str(e)}')

    def fetch_games_data(self, fields: str, query_body: str, data_type: str) -> List[Dict[str, Any]]:
        '''
        Make a query to the IGDB Games API endpoint.

        Args:
            fields (str): The fields to return
            query_body (str): Additional query parameters
            data_type (str): Type of data being fetched (top, latest, upcoming)

        Returns:
            List[Dict[str, Any]]: List of cleaned game data

        Raises:
            RequestException: if the request fails
        '''
        query = f'fields {fields}; {query_body};'
        data = self._make_api_request(query)
        return self._clean_data(data, data_type)

    def get_top_games(self, limit: int) -> List[Dict[str, Any]]:
        """
        Get top-rated games sorted by aggregated rating.

        Args:
            limit (int): Number of games to retrieve

        Returns:
            List[Dict[str, Any]]: List of top-rated games
        """
        query_body = f'where aggregated_rating != null & first_release_date != null & cover.image_id !=null; sort aggregated_rating desc; limit {limit}'
        fields = 'name,first_release_date,genres.name,language_supports.language.name,platforms.name,screenshots.image_id,storyline,summary,aggregated_rating,videos.video_id,cover.image_id,involved_companies.company.name'

        return self.fetch_games_data(fields=fields, query_body=query_body, data_type='top')

    def get_latest_games(self, limit: int, days_back: int) -> List[Dict[str, Any]]:
        """
        Get recently released games from the last X days.

        Args:
            limit (int): Number of games to retrieve
            days_back (int): How many days back to search

        Returns:
            List[Dict[str, Any]]: List of recently released games
        """
        # Calculate timestamp for X days ago
        current_time = datetime.now()
        past_date = current_time - timedelta(days=days_back)
        unix_timestamp = int(past_date.timestamp())

        query_body = f'where first_release_date >= {unix_timestamp} & first_release_date <= {int(current_time.timestamp())} & cover.image_id !=null; sort first_release_date desc; limit {limit}'
        fields = 'name,first_release_date,genres.name,language_supports.language.name,platforms.name,screenshots.image_id,storyline,summary,aggregated_rating,videos.video_id,cover.image_id,involved_companies.company.name'

        return self.fetch_games_data(fields=fields, query_body=query_body, data_type='latest')

    def get_upcoming_games(self, limit: int, days_ahead: int) -> List[Dict[str, Any]]:
        """
        Get upcoming games scheduled to release in the next X days.

        Args:
            limit (int): Number of games to retrieve
            days_ahead (int): How many days ahead to search

        Returns:
            List[Dict[str, Any]]: List of upcoming games
        """
        # Calculate timestamp for today and X days in the future
        current_time = datetime.now()
        future_date = current_time + timedelta(days=days_ahead)
        current_timestamp = int(current_time.timestamp())
        future_timestamp = int(future_date.timestamp())

        query_body = f'where first_release_date >= {current_timestamp} & first_release_date <= {future_timestamp} & cover.image_id !=null; sort first_release_date asc; limit {limit}'
        fields = 'name,first_release_date,genres.name,language_supports.language.name,platforms.name,screenshots.image_id,storyline,summary,aggregated_rating,videos.video_id,cover.image_id,involved_companies.company.name'

        return self.fetch_games_data(fields=fields, query_body=query_body, data_type='upcoming')

    def _extract_nested_value(self, data: Optional[List[Dict[str, Any]]], field: str) -> Optional[List[str]]:
        """
        Generic method to extract values from nested dictionaries in a list.

        Args:
            data (List[Dict[str, Any]]): List of dictionaries
            field (str): Field to extract (e.g., 'name')

        Returns:
            List[str]: List of extracted values or None if no values
        """
        if not data:
            return None

        result = []
        for item in data:
            if isinstance(item, dict):
                value = item.get(field, '')
                if value:
                    result.append(value)

        return result if result else None

    def _get_genres(self, genres: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract genre names from genre data"""
        return self._extract_nested_value(genres, 'name')

    def _get_platforms(self, platforms: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract platform names from platform data"""
        return self._extract_nested_value(platforms, 'name')

    def _get_screenshots(self, screenshots: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract and format screenshot URLs from screenshot data"""
        if not screenshots:
            return None

        result = []
        for screenshot in screenshots:
            image_id = screenshot.get('image_id', '')
            if image_id:
                result.append(
                    f'https://images.igdb.com/igdb/image/upload/t_720p/{image_id}.jpg')

        return result if result else None

    def _get_videos(self, videos: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract and format video URLs from video data"""
        if not videos:
            return None

        result = []
        for video in videos:
            video_id = video.get('video_id', '')
            if video_id:
                result.append(video_id)

        return result if result else None

    def _get_developers(self, involved_companies: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract developer names from involved companies data"""
        if not involved_companies:
            return None

        result = []
        for company_data in involved_companies:
            company = company_data.get('company', {})
            if isinstance(company, dict):
                company_name = company.get('name', '')
                if company_name:
                    result.append(company_name)

        return result if result else None

    def _get_languages(self, languages: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract language names from language supports data"""
        if not languages:
            return None

        result = []
        for language_data in languages:
            language = language_data.get('language', {})
            if isinstance(language, dict):
                language_name = language.get('name', '')
                if language_name and language_name not in result:
                    result.append(language_name)

        return result if result else None

    def _clean_data(self, data: List[Dict[str, Any]], data_type: str) -> List[Dict[str, Any]]:
        """
        Clean and format the raw game data from the API.

        Args:
            data (List[Dict[str, Any]]): Raw game data from API
            data_type (str): Type of data (top, latest, upcoming)

        Returns:
            List[Dict[str, Any]]: Cleaned and formatted game data
        """
        cleaned_data = []

        for game in data:
            # Use safe extraction for all fields
            name = game.get('name')
            summary = game.get('summary')
            storyline = game.get('storyline')

            # Cover image processing
            cover_data = game.get('cover', {})
            cover_image_id = cover_data.get(
                'image_id') if isinstance(cover_data, dict) else None
            cover_url = f'https://images.igdb.com/igdb/image/upload/t_cover_big/{cover_image_id}.jpg' if cover_image_id else None

            # Release date processing
            release_date = None
            first_release_timestamp = game.get('first_release_date')
            if first_release_timestamp:
                try:
                    release_date = datetime.fromtimestamp(
                        first_release_timestamp).strftime('%Y-%m-%d')
                except (ValueError, TypeError):
                    pass

            # Process other fields using helper methods
            genres = self._get_genres(game.get('genres'))
            developers = self._get_developers(game.get('involved_companies'))
            platforms = self._get_platforms(game.get('platforms'))
            screenshots = self._get_screenshots(game.get('screenshots'))
            languages = self._get_languages(game.get('language_supports'))
            videos = self._get_videos(game.get('videos'))

            # Rating processing
            rating = game.get('aggregated_rating')
            if rating:
                try:
                    rating = round(float(rating), 1)
                except (ValueError, TypeError):
                    rating = None

            # Skip games without a name
            if not name:
                continue

            cleaned_data.append({
                'name': name,
                'summary': summary,
                'storyline': storyline,
                'cover_image_url': cover_url,
                'release_date': release_date,
                'data_type': data_type,
                'developers': developers,
                'platforms': platforms,
                'languages': languages,
                'genres': genres,
                'screenshots': screenshots,
                'videos': videos,
                'rating': rating
            })

        return cleaned_data
