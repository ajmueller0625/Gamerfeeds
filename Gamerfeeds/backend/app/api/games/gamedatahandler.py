import requests
import json
from typing import Any, Dict, List
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

    def authenticate(self) -> None:
        """
        Authenticate with the Twitch API to get an access token for IGDB.

        Raises:
            RequestException: if authentication request fails
        """
        auth_url = 'https://id.twitch.tv/oauth2/token'
        payload = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'client_credentials'
        }

        response = requests.post(auth=auth_url, data=payload)

        if response.status_code == 200:
            data = response.json()
            self.access_token = data['access_token']
            # Set expiration time (60 days subtract by 1 day in seconds)
            self.token_expiration = datetime.now(
            ) + timedelta(seconds=data['expires_in'] - 86400)
        else:
            raise RequestException(
                f'Authentication failed: {response.status_code} - {response.text}')

    def ensure_token(self) -> bool:
        pass

    def fetch_games_data(self, query: str, fields: str) -> List[Dict[str, Any]]:
        pass

    # A test method
    def export_data_to_json(self) -> None:
        pass
