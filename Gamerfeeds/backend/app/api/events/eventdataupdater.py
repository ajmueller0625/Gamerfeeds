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
from app.api.events.eventdatahandler import EventDataHandler
from app.api.games.gamedatahandler import GameDataHandler

from app.api.core.models import (
    Event, Game, GameDataType,
    Video
)


# Setup logging
def setup_logger(name: str, log_file: str = 'event_updater.log', level=logging.INFO):
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


logger = setup_logger(__name__, log_file='event_updater.log')


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


def check_event_exist(name: str, start_date: datetime, db: Session) -> bool:
    """
    Check if the event exists based on name and start date

    Args:
        name: The event's name
        start_date: The event's start date
        db: Database session

    Returns:
        True if the event exists
    """
    if not name or not start_date:
        return False

    try:
        exist = db.scalars(select(Event).where(Event.name == name).where(
            Event.start_date == start_date)).one_or_none()
        return exist is not None
    except SQLAlchemyError as e:
        logger.error(f"Error checking event existence for Event - {name}: {e}")
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


def get_all_data(field_list: Optional[List[str]], model_class: Any, db: Session, unique_field='name') -> List[Any]:
    """
    Get all data from database based in model class 

    Args:
        field_list: List of field values to get or create
        model_class: Model class data should have
        db: Database session
        unique_field: The unique field of the database model

    Return:
        List of model instances
    """
    if not field_list:
        return []

    result = []
    for field in field_list:
        item = get_data_from_model(field, model_class, db, unique_field)
        if item:
            result.append(item)

    return result


@lru_cache(maxsize=100)
def get_data_from_model(field: str, model_class: Any, db: Session, unique_field: str = "name") -> Any:
    """
    Check if the data exists based on field, unique field and class model
    then create a new data if it does not with cache for performance

    Args:
        field: The data field value
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
            f"Error checking data existence for Data - {field}: {e}")
        return None


def get_game_by_id(game_id: int, db: Session) -> Optional[Game]:
    """
    Get a Game instance by its ID

    Args:
        game_id: The game ID
        db: Database session

    Returns:
        Game instance or None if not found
    """
    try:
        return db.scalars(select(Game).where(Game.id == game_id)).one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"Error getting game with ID {game_id}: {e}")
        return None


def update_exist_events(db: Session) -> None:
    """
    Delete all past events from the database (events with end dates in the past)

    Args:
        db: Database session
    """
    try:
        today = datetime.now()
        # Delete all events that already ended
        query = delete(Event).where(Event.end_date <= today)
        rows_deleted = db.execute(query).rowcount
        logger.info(
            f"Deleted {rows_deleted} already ended events from the database")
    except SQLAlchemyError as e:
        logger.error(f"Error deleting past events: {e}")
        raise


async def batch_save_events(events: List[Dict[str, Any]], batch_size: int = 10) -> Tuple[int, int, int]:
    """
    Save events to database in batches with error handling

    Args:
        events: List of events dictionaries
        batch_size: Number of events to save in each batch

    Returns:
        Tuple of (saved_count, skipped_count, error_count)
    """
    total_events = len(events)
    saved_count = 0
    skipped_count = 0
    error_count = 0

    logger.info(
        f"Starting to save {total_events} events in batches of {batch_size}")

    # Process in batches
    for i in range(0, total_events, batch_size):
        batch = events[i:i+batch_size]
        batch_start = i
        batch_end = min(i + batch_size, total_events)
        logger.info(
            f"Processing batch {batch_start+1}-{batch_end} of {total_events}")

        with db_session_manager() as db:
            for event in batch:
                try:
                    # Check if event already exists
                    event_exists = check_event_exist(
                        event.get('name', ''), event.get('start_date'), db)

                    if event_exists:
                        skipped_count += 1
                        continue

                    # Process data type
                    data_type_id = get_data_type_id(event.get('data_type'), db)

                    # Process videos
                    videos = get_all_data(
                        event.get('videos'), Video, db, 'video_url_id')

                    # Process games
                    games = []
                    for game_id in event.get('games', []):
                        game = get_game_by_id(game_id, db)
                        if game:
                            games.append(game)

                    # Create new event
                    new_event = Event(
                        name=event.get('name'),
                        description=event.get('description'),
                        cover_image_url=event.get('cover_image_url'),
                        start_date=event.get('start_date'),
                        end_date=event.get('end_date'),
                        website_url=event.get('website_url'),
                        location=event.get('location'),
                        data_type_id=data_type_id,
                        games=games,
                        videos=videos
                    )

                    db.add(new_event)
                    saved_count += 1

                except Exception as e:
                    error_count += 1
                    logger.error(
                        f'Error saving event {event.get("name", "Unknown")}: {e}')

    logger.info(
        f'Database update complete. Saved: {saved_count}, Skipped: {skipped_count}, Error: {error_count}')
    return saved_count, skipped_count, error_count


async def update_events(client_id: str, client_secret: str) -> None:
    """
    Function for updating event data asynchronously

    Args:
        client_id: IGDB app client id
        client_secret: IGDB app client secret id
    """
    try:
        # First clean up existing events
        with db_session_manager() as db:
            update_exist_events(db)

        handler = EventDataHandler(
            client_id=client_id, client_secret=client_secret)

        logger.info("Fetching event data")
        events = handler.get_events(limit=150, days_ahead=180)
        logger.info(f"Retrieved {len(events)} events from API")

        saved, skipped, errors = await batch_save_events(events)

        logger.info(
            f"Events update: Processed {len(events)}, Saved {saved}, Skipped {skipped}, Errors {errors}")

    except Exception as e:
        logger.error(
            f"Failed to update event data: {e}", exc_info=True)
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
        # Execute single update task for all events
        await update_events(client_id, client_secret)
        logger.info("Event data update completed successfully")
    except Exception as e:
        logger.error(f"Main update process failed: {e}", exc_info=True)


if __name__ == '__main__':
    asyncio.run(main())
