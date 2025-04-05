import requests
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from requests import RequestException


class EventDataHandler:
    def __init__(self, client_id: str, client_secret: str) -> None:
        """
        Initialize the EventDataHandler.

        Args:
            client_id (str): Your Twitch client ID
            client_secret (str): Your Twitch client secret
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.events_url = 'https://api.igdb.com/v4/events'
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

    def _make_api_request(self, url: str, query: str) -> List[Dict[str, Any]]:
        """
        Make a request to the IGDB API.

        Args:
            url (str): The API endpoint URL
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
                url=url, headers=headers, data=query)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise RequestException(f'Query failed: {str(e)}')

    def fetch_events_data(self, fields: str, query_body: str) -> List[Dict[str, Any]]:
        '''
        Make a query to the IGDB Events API endpoint.

        Args:
            fields (str): The fields to return
            query_body (str): Additional query parameters

        Returns:
            List[Dict[str, Any]]: List of cleaned event data

        Raises:
            RequestException: if the request fails
        '''
        query = f'fields {fields}; {query_body};'
        data = self._make_api_request(self.events_url, query)

        return self._clean_events_data(data)

    def get_events(self, limit: int, days_ahead: int) -> List[Dict[str, Any]]:
        """
        Get all relevant events (both current and upcoming).

        Args:
            limit (int): Number of events to retrieve
            days_ahead (int): How many days ahead to search

        Returns:
            List[Dict[str, Any]]: List of events
        """
        # Calculate timestamp for today and X days in the future
        current_time = datetime.now()
        future_date = current_time + timedelta(days=days_ahead)
        current_timestamp = int(current_time.timestamp())
        future_timestamp = int(future_date.timestamp())

        # Get events that end in the future (includes both current and upcoming)
        query_body = f'where end_time >= {current_timestamp} & start_time <= {future_timestamp}; sort start_time asc; limit {limit}'
        fields = 'name,description,start_time,end_time,event_logo.image_id,event_networks.url,live_stream_url,videos'

        return self.fetch_events_data(fields=fields, query_body=query_body)

    def _extract_url(self, event_networks: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract website URL from event_networks data"""
        if not event_networks:
            return None

        result = []
        for network in event_networks:
            url = network.get('url', '')
            if url:
                result.append(url)

        return result if result else None

    def _get_videos(self, videos: Optional[List[Dict[str, Any]]]) -> Optional[List[str]]:
        """Extract video URL IDs from video data"""
        if not videos:
            return None

        result = []
        for video in videos:
            video_id = video.get('video_id', '')
            if video_id:
                result.append(video_id)

        return result if result else None

    def _clean_events_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Clean and format the raw event data from the API.

        Args:
            data (List[Dict[str, Any]]): Raw event data from API

        Returns:
            List[Dict[str, Any]]: Cleaned and formatted event data
        """
        cleaned_data = []

        for event in data:
            # Use safe extraction for all fields
            name = event.get('name')
            description = event.get('description')

            # Skip events without a name
            if not name:
                continue

            # Cover image processing
            event_logo = event.get('event_logo', {})
            cover_image_id = event_logo.get(
                'image_id') if isinstance(event_logo, dict) else None
            cover_image_url = f'https://images.igdb.com/igdb/image/upload/t_original/{cover_image_id}.jpg' if cover_image_id else None

            # Date processing
            start_date = None
            end_date = None
            start_timestamp = event.get('start_time')
            end_timestamp = event.get('end_time')

            if start_timestamp:
                try:
                    start_date = datetime.fromtimestamp(start_timestamp)
                except (ValueError, TypeError):
                    pass

            if end_timestamp:
                try:
                    end_date = datetime.fromtimestamp(end_timestamp)
                except (ValueError, TypeError):
                    pass

            # Get website URL from event_networks
            urls = self._extract_url(event.get('event_networks'))

            # Add live stream URL if available
            live_stream_url = event.get('live_stream_url')

            # Videos
            videos = self._get_videos(event.get('videos'))

            cleaned_data.append({
                'name': name,
                'description': description,
                'cover_image_url': cover_image_url,
                'start_date': start_date,
                'end_date': end_date,
                'live_stream_url': live_stream_url,
                'urls': urls,
                'videos': videos,
            })

        return cleaned_data
