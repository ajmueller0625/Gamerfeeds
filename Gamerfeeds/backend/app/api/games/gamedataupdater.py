from contextlib import contextmanager
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler
from typing import Any, Dict
from app.api.db_setup import get_db
from sqlalchemy.exc import SQLAlchemyError
from functools import lru_cache
from sqlalchemy.orm import Session
from sqlalchemy import select

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
def get_data_from_model(field: str, model_class, db: Session, unique_field: str = "name") -> Dict[str: Any]:
    """
    Check if the data exist base on field, unique field and class model
    then create a new data if it does not with cache for performance

    Args:
        field: The game data
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
