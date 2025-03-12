from contextlib import contextmanager
from datetime import datetime, timedelta
import logging
import asyncio
from logging.handlers import RotatingFileHandler
from os import getenv
from typing import Any, Dict, List, Tuple, Optional

from dotenv import load_dotenv
from app.api.db_setup import get_db
from sqlalchemy.exc import SQLAlchemyError
from functools import lru_cache
from sqlalchemy.orm import Session
from sqlalchemy import select, delete, text
from app.api.games.gamedatahandler import GameDataHandler

from app.api.core.models import (
    Game, GameDataType,
    Developer, Platform,
    Language, Genre,
    Screenshot, Video
)


# Setup logging
def setup_logger(name: str, log_file: str = 'game_updater.log', level=logging.INFO):
    """
    Configure a logger with rotating file handler

    Args:
        name: Logger name
        log_file: Path to log file
        level: Logging level

    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Check if logger already has handlers to avoid duplicates
    if not logger.handlers:
        # Create rotating file handler (10MB max, keep 5 backup files)
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(level)

        # Create console handler with a higher log level
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.ERROR)

        # Create formatter and add it to the handlers
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        # Add handlers to the logger
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger


logger = setup_logger(__name__, log_file='game_updater.log')


@contextmanager
def db_session_manager():
    """
    Context manager for database sessions to ensure proper cleanup
    """
    db = next(get_db())
    try:
        yield db
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error: {e}")
        raise
    finally:
        db.close()


def check_game_exist(name: str, release_date: str, db: Session) -> bool:
    """
    Check if the game exists based on name and release date

    Args:
        name: The game's name
        release_date: The game's release date
        db: Database session

    Returns:
        True if the game exists
    """
    if not name or not release_date:
        return False

    try:
        exist = db.scalars(select(Game).where(Game.name == name).where(
            Game.release_date == release_date)).one_or_none()
        return exist
    except SQLAlchemyError as e:
        logger.error(f"Error checking game existence for Game - {name}: {e}")
        return False  # Assume it does not exist


@lru_cache(maxsize=50)
def get_data_type_id(name: str, db: Session) -> int:
    """
    Check if the data type exists and create a new data type if it does not
    with cache for performance

    Args:
        name: Game data type name
        db: Database Session

    Returns:
        Data type ID
    """
    try:
        exist_data_type = db.scalars(
            select(GameDataType.id).where(GameDataType.name == name)).one_or_none()
        if exist_data_type:
            return exist_data_type

        new_data_type = GameDataType(name=name)
        db.add(new_data_type)
        db.flush()

        return new_data_type.id
    except SQLAlchemyError as e:
        logger.error(f"Error getting data type id for Data type - {name}: {e}")
        raise


@lru_cache(maxsize=100)
def get_data_from_model(field: str, model_class: Any, db: Session, unique_field: str = "name") -> Any:
    """
    Check if the data exists based on field, unique field and class model
    then create a new data if it does not with cache for performance

    Args:
        field: The game data field value
        model_class: Model class data should have
        db: Database session
        unique_field: The unique field of the database model

    Returns:
        Instance of the model class
    """
    if not field:
        return None

    try:
        exist = db.scalars(select(model_class).where(
            getattr(model_class, unique_field) == field)).one_or_none()

        if exist:
            return exist

        new_object = model_class(**{unique_field: field})
        db.add(new_object)
        db.flush()

        return new_object

    except SQLAlchemyError as e:
        logger.error(
            f"Error checking game data existence for Data - {field}: {e}")
        return None


def get_all_data(field_list: Optional[List[str]], model_class: Any, db: Session, uniqe_field='name') -> List[Any]:
    """
    Get all data from database based in model class 

    Args:
        field_list: List of field values to get or create
        model_class: Model class data should have
        db: Database session
        uniqe_field: The unique field of the database model

    Return:
        List of model instances
    """
    if not field_list:
        return []

    result = []
    for field in field_list:
        item = get_data_from_model(field, model_class, db, uniqe_field)
        if item:
            result.append(item)

    return result


def update_exist_top_game(game: Dict[str, Any], db: Session) -> None:
    """
    Update an existing game with data type top.
    This function assumes the existence check has already been performed.

    Args:
        game: Dictionary of game data
        db: Database session
    """
    try:
        # Get the game by name
        exist_game = db.scalars(select(Game).where(
            Game.name == game.get('name', ''))).first()

        # Update game fields
        exist_game.summary = game.get('summary', '')
        exist_game.storyline = game.get('storyline', '')
        exist_game.cover_image_url = game.get('cover_image_url', '')
        exist_game.rating = game.get('rating')

        # Update relationships
        exist_game.platforms = get_all_data(
            game.get('platforms', []), Platform, db)
        exist_game.languages = get_all_data(
            game.get('languages', []), Language, db)
        exist_game.screenshots = get_all_data(
            game.get('screenshots', []), Screenshot, db, 'screenshot_url')
        exist_game.videos = get_all_data(
            game.get('videos', []), Video, db, 'video_url')

        db.add(exist_game)

    except SQLAlchemyError as e:
        logger.error(
            f"Error updating existing top game {game.get('name')}: {e}")
        raise


def update_exist_upcoming_game(db: Session) -> None:
    """
    Delete all released games from the upcoming games category
    (games with release dates in the past)

    Args:
        db: Database session
    """
    try:
        upcoming_type_id = get_data_type_id('upcoming', db)
        today = datetime.now().date()
        query = delete(Game).where(Game.release_date <= today).where(
            Game.data_type_id == upcoming_type_id)
        rows_deleted = db.execute(query).rowcount
        logger.info(
            f"Deleted {rows_deleted} already released games from upcoming category")
    except SQLAlchemyError as e:
        logger.error(f"Error deleting released games: {e}")
        raise


def update_exist_latest_game(db: Session) -> None:
    """
    Delete games that are no longer "latest" (older than 6 months)

    Args:
        db: Database session
    """
    try:
        latest_type_id = get_data_type_id('latest', db)
        cutoff_date = datetime.now().date() - timedelta(days=180)
        query = delete(Game).where(Game.release_date <= cutoff_date).where(
            Game.data_type_id == latest_type_id)
        rows_deleted = db.execute(query).rowcount
        logger.info(f"Deleted {rows_deleted} old games")
    except SQLAlchemyError as e:
        logger.error(f"Error deleting old games: {e}")
        raise


async def batch_save_games(games: List[Dict[str, Any]], batch_size: int = 10) -> Tuple[int, int, int]:
    """
    Save games to database in batches with error handling

    Args:
        games: List of games dictionaries
        batch_size: Number of games to save in each batch

    Returns:
        Tuple of (saved_count, skipped_count, error_count)
    """
    total_games = len(games)
    saved_count = 0
    skipped_count = 0
    error_count = 0

    logger.info(
        f"Starting to save {total_games} games in batches of {batch_size}")

    # Process in batches
    for i in range(0, total_games, batch_size):
        batch = games[i:i+batch_size]
        batch_start = i
        batch_end = min(i + batch_size, total_games)
        logger.info(
            f"Processing batch {batch_start+1}-{batch_end} of {total_games}")

        with db_session_manager() as db:
            for game in batch:
                try:
                    # Check if game already exists
                    game_exists = check_game_exist(
                        game.get('name', ''), game.get('release_date'), db)

                    # Handle existing games
                    if game_exists:
                        data_type = game.get('data_type', '')
                        if data_type == 'top':
                            # We only update top-rated games when they already exist
                            update_exist_top_game(game, db)
                            saved_count += 1
                        else:
                            # For other types, we skip existing games as they're managed by their respective update functions
                            skipped_count += 1
                        continue

                    # Process new game
                    data_type_id = get_data_type_id(game.get('data_type'), db)

                    # Process related data
                    developers = get_all_data(
                        game.get('developers'), Developer, db)
                    platforms = get_all_data(
                        game.get('platforms'), Platform, db)
                    languages = get_all_data(
                        game.get('languages'), Language, db)
                    genres = get_all_data(
                        game.get('genres'), Genre, db)
                    screenshots = get_all_data(
                        game.get('screenshots'), Screenshot, db, 'screenshot_url')
                    videos = get_all_data(
                        game.get('videos'), Video, db, 'video_url')

                    new_game = Game(
                        name=game.get('name'),
                        summary=game.get('summary'),
                        storyline=game.get('storyline'),
                        cover_image_url=game.get('cover_image_url'),
                        release_date=game.get('release_date'),
                        rating=game.get('rating'),
                        data_type_id=data_type_id,
                        platforms=platforms,
                        developers=developers,
                        genres=genres,
                        languages=languages,
                        screenshots=screenshots,
                        videos=videos
                    )

                    db.add(new_game)
                    saved_count += 1

                except Exception as e:
                    error_count += 1
                    logger.error(
                        f'Error saving game {game.get("name", "Unknown")}: {e}')

    logger.info(
        f'Database update complete. Saved: {saved_count}, Skipped: {skipped_count}, Error: {error_count}')
    return saved_count, skipped_count, error_count


async def update_top_games(client_id: str, client_secret: str) -> None:
    """
    Function for updating top games data asynchronously

    Args:
        client_id: IGDB app client id
        client_secret: IGDB app client secret id
    """
    try:
        handler = GameDataHandler(
            client_id=client_id, client_secret=client_secret)

        logger.info("Fetching top games data")
        top_games = handler.get_top_games(limit=500)
        logger.info(f"Retrieved {len(top_games)} top games from API")

        saved, skipped, errors = await batch_save_games(top_games)

        logger.info(
            f"Top Games update: Processed {len(top_games)}, Saved {saved}, Skipped {skipped}, Errors {errors}")

    except Exception as e:
        logger.error(f"Failed to update top games data: {e}", exc_info=True)
        raise


async def update_upcoming_games(client_id: str, client_secret: str) -> None:
    """
    Function for updating upcoming games data asynchronously

    Args:
        client_id: IGDB app client id
        client_secret: IGDB app client secret id
    """
    try:
        # First clean up existing upcoming games
        with db_session_manager() as db:
            update_exist_upcoming_game(db)

        handler = GameDataHandler(
            client_id=client_id, client_secret=client_secret)

        logger.info("Fetching upcoming games data")
        upcoming_games = handler.get_upcoming_games(limit=500, days_ahead=90)
        logger.info(f"Retrieved {len(upcoming_games)} upcoming games from API")

        saved, skipped, errors = await batch_save_games(upcoming_games)

        logger.info(
            f"Upcoming Games update: Processed {len(upcoming_games)}, Saved {saved}, Skipped {skipped}, Errors {errors}")

    except Exception as e:
        logger.error(
            f"Failed to update upcoming games data: {e}", exc_info=True)
        raise


async def update_latest_games(client_id: str, client_secret: str) -> None:
    """
    Function for updating latest games data asynchronously

    Args:
        client_id: IGDB app client id
        client_secret: IGDB app client secret id
    """
    try:
        # First clean up old "latest" games
        with db_session_manager() as db:
            update_exist_latest_game(db)

        handler = GameDataHandler(
            client_id=client_id, client_secret=client_secret)

        logger.info("Fetching latest games data")
        latest_games = handler.get_latest_games(limit=500, days_back=90)
        logger.info(f"Retrieved {len(latest_games)} latest games from API")

        saved, skipped, errors = await batch_save_games(latest_games)

        logger.info(
            f"Latest Games update: Processed {len(latest_games)}, Saved {saved}, Skipped {skipped}, Errors {errors}")

    except Exception as e:
        logger.error(f"Failed to update latest games data: {e}", exc_info=True)
        raise


async def main() -> None:
    """
    Main function to run all update tasks
    """
    load_dotenv()
    client_id = getenv('TWITCH_CLIENT_ID')
    client_secret = getenv('TWITCH_SECRET_ID')

    if not client_id or not client_secret:
        logger.error(
            "Missing environment variables. Make sure TWITCH_CLIENT_ID and TWITCH_SECRET_ID are set.")
        return

    try:
        # Execute all update tasks concurrently
        await asyncio.gather(
            update_top_games(client_id, client_secret),
            update_upcoming_games(client_id, client_secret),
            update_latest_games(client_id, client_secret)
        )
        logger.info("All game data updates completed successfully")
    except Exception as e:
        logger.error(f"Main update process failed: {e}", exc_info=True)


if __name__ == '__main__':
    asyncio.run(main())
