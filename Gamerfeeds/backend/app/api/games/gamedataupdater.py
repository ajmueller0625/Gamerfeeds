from contextlib import contextmanager
from datetime import datetime, timedelta
import logging
import asyncio
from logging.handlers import RotatingFileHandler
from typing import Any, Dict, List
from app.api.db_setup import get_db
from sqlalchemy.exc import SQLAlchemyError
from functools import lru_cache
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.api.games.gamedatahandler import GameDataHandler

from app.api.core.models import (
    Game, GameDataType,
    Developer, Platform,
    Language, Genre,
    Screenshot, Video
)


# Setup logging
def setup_logger(name: str, log_file: str = 'news_updater.log', level=logging.INFO):
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


logger = setup_logger(__name__)


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
    Check if the game exist base on name and release date

    Args:
        name: The games name
        release_date: The games release date
        db: Database session

    Returns:
        True if the game exist
    """

    try:
        exist = db.scalars(select(Game).where(Game.name == name).where(
            Game.release_date == release_date)).first()
        return exist is not None
    except SQLAlchemyError as e:
        logger.error(f"Error checking game existence for Game - {name}: {e}")
        return False  # Assume it does not exist


@lru_cache(maxsize=50)
def get_data_type_id(name: str, db: Session) -> int:
    """
    Check if the data type exist and create a new data type if it does not
    with cache for performance

    Arg:
        name: Game data type name
        db: Database Session

    Returns:
        Data type ID

    """
    try:
        exist_data_type = db.scalars(
            select(GameDataType.id).where(GameDataType.name == name)).first()
        if exist_data_type:
            return exist_data_type

        new_data_type = GameDataType(name=name)
        db.add(new_data_type)
        db.flush()

        return new_data_type.id
    except SQLAlchemyError as e:
        logging.error(f"Error data type id for Data type - {name}: {e}")
        raise


@lru_cache(maxsize=100)
def get_data_from_model(field: str, model_class: Any, db: Session, unique_field: str = "name") -> Dict[str: Any]:
    """
    Check if the data exist base on field, unique field and class model
    then create a new data if it does not with cache for performance

    Args:
        field: The game data
        model_class: Model class data should have
        db: Database session
        unique field: The unique field of the database model

    Returns:
        Dict of the data
    """

    try:
        exist = db.scalars(select(model_class).where(
            getattr(model_class, unique_field) == field)).first()

        if exist:
            return exist

        new_object = model_class(**{unique_field: field})
        db.add(new_object)
        db.flush()

        return new_object

    except SQLAlchemyError as e:
        logger.error(
            f"Error checking game data existence for Data - {field}: {e}")
        return False  # Assume the data does not exist


def get_all_data(field_list: List[str], model_class: Any, db: Session, uniqe_field='name'):
    """
    Get all data from database based in model class 

    Args:
        field: The game data
        model_class: Model class data should have
        db: Database session
        unique field: The unique field of the database model

    Return:
        List of data from the database
    """
    result = []
    for field in field_list:
        result.append(get_data_from_model(field, model_class, db, uniqe_field))

    return result


def update_exist_top_game(game: Dict[str: Any], db: Session):
    """
    Update an existing game with data type top

    Args:
        game: Dictionary of game data
        db: Database session
    """
    exist_game = db.scalars(select(Game).where(
        Game.name == game.get('name', ''))).first()

    exist_game.summary = game.get('summary', '')
    exist_game.storyline = game.get('storyline', '')
    exist_game.cover_image_url = game.get('cover_image_url', '')
    exist_game.platforms = get_all_data(
        game.get('platforms', []), Platform, db)
    exist_game.languages = get_all_data(
        game.get('languages', []), Language, db)
    exist_game.screenshots = get_all_data(
        game.get('screenshots', []), Screenshot, db)
    exist_game.videos = get_all_data(game.get('videos', []), Video, db)
    exist_game.rating = game.get('rating')

    db.add(exist_game)


def update_exist_upcoming_game(db: Session):
    query = delete(Game).where(Game.release_date >= datetime.now().date())
    db.execute(query)


def update_exist_latest_game(db: Session):
    six_months = timedelta(days=180)
    query = delete(Game).where(
        (Game.release_date - datetime.now()) >= six_months)
    db.execute(query)


async def batch_save_games(games: List[Dict[str: Any]], batch_size: int = 10):
    """
    Save games to database in batches with error handling

    Args:
        games: List of games dictionaries
        batch_size: Number of articles to save in each batch
    """
    total_games = len(games)
    saved_count = 0
    skipped_count = 0
    error_count = 0

    # Process in batches
    for i in range(0, total_games, batch_size):
        batch = games[i:i+batch_size]

        with db_session_manager() as db:
            for game in batch:
                try:
                    # Skip if game has no cover url image
                    if not game.get('cover_image_url'):
                        skipped_count += 1
                        continue

                    if check_game_exist(game.get('name', ''), game.get('release_date', datetime.now().date()), db):
                        data_type = game.get('data_type', '')
                        if data_type == 'top':
                            update_exist_top_game(game, db)
                            continue
                        else:
                            skipped_count += 1
                            continue

                    data_type_id = get_data_type_id(game.get('data_type'), db)
                    developers = get_all_data(field_list=game.get(
                        'developers', []), model_class=Developer, db=db)
                    platforms = get_all_data(field_list=game.get(
                        'platforms', []), model_class=Platform, db=db)
                    languages = get_all_data(field_list=game.get(
                        'languages', []), model_class=Language, db=db)
                    genres = get_all_data(field_list=game.get(
                        'genres', []), model_class=Genre, db=db)
                    screenshots = get_all_data(field_list=game.get(
                        'screenshots', []), model_class=Screenshot, db=db, uniqe_field='screenshot_url')
                    videos = get_all_data(field_list=game.get(
                        'videos', []), model_class=Video, db=db, uniqe_field='video_url')

                    new_game = Game(
                        name=game.get('name'),
                        summary=game.get('summary'),
                        storyline=game.get('storyline'),
                        cover_image_url=game.get('cover_image_url'),
                        release_date=game.get(
                            'release_date', datetime.now().date()),
                        rating=game.get('rating'),
                        data_type_id=data_type_id,
                        platforms=platforms,
                        developers=developers,
                        genres=genres,
                        languages=languages,
                        screenshots=screenshots,
                        videos=videos
                    )

                    saved_count += 1
                    db.add(new_game)

                except Exception as e:
                    error_count += 1
                    logger.error(
                        f'Error saving game {game.get('name', 'Unknown')}: {e}')

    logger.info(
        f'Database update complete. Saved: {saved_count}, Skipped: {skipped_count}, Error: {error_count}')
    return saved_count, skipped_count, error_count


async def update_top_games(client_id: str, client_secret: str):
    """
    Function for updating top games data asynchronously

    Args:
        client_id: IGDB app client id
        client_secret: IGDB app client secret id
    """
    try:
        handler = GameDataHandler(
            client_id=client_id, client_secret=client_secret)

        logger.info(f"Fetching top games data")
        top_games = handler.get_top_games(limit=500)

        saved, skipped, errors = await batch_save_games(top_games)

        logger.info(
            f"Top Games update: Processed {len(top_games)}, Saved {saved}, Skipped {skipped}, Errors {errors}")
        logger.info(
            f"Successfully updated the database with {len(top_games)} games")

    except Exception as e:
        logger.error(f"Failed to update news data: {e}", exc_info=True)
        raise
