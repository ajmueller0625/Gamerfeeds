from typing import Any, Dict, List
import requests


class GameDataHandler:
    def __init__(self, client_id: str, client_secret: str) -> None:
        """
        Initialize the IGDB Games API wrapper.

        Args:
            client_id (str): Your Twitch client ID
            client_secret (str): Your Twitch client secret
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.games_url = 'https://api.igdb.com/v4/games'
        self.access_token = None
        self.token_expiration = None

    def authenticate(self) -> bool:
        pass

    def fetch_games_data(self) -> List[Dict[str, Any]]:
        pass
