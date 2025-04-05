from contextlib import contextmanager
from datetime import datetime, timedelta
from functools import lru_cache
import logging
import asyncio
from logging.handlers import RotatingFileHandler
from os import getenv
from typing import Any, Dict, List, Tuple, Optional

from dotenv import load_dotenv
from app.api.db_setup import get_db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import select, delete, text
from app.api.events.eventdatahandler import EventDataHandler

from app.api.core.models import (
    Developer, Event, EventURL, EventVideo,
    Genre, Language, Platform, Screenshot, Video
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


def check_event_exist(name: str, start_time: datetime, db: Session) -> Optional[Event]:
    """
    Check if the event exists based on name and start time

    Args:
        name: The event's name
        start_time: The event's start time
        db: Database session

    Returns:
        Event object if exists, None otherwise
    """
    if not name or not start_time:
        return None

    try:
        exist = db.scalars(select(Event)
                           .where(Event.name == name)
                           .where(Event.start_time == start_time)).one_or_none()
        return exist
    except SQLAlchemyError as e:
        logger.error(f"Error checking event existence for Event - {name}: {e}")
        return None


def delete_expired_events(db: Session, days_after_end: int = 7) -> int:
    """
    Delete events that have ended more than specified days ago

    Args:
        db: Database session
        days_after_end: Number of days after event end to keep the event before deletion

    Returns:
        Number of deleted events
    """
    try:
        cutoff_date = datetime.now() - timedelta(days=days_after_end)
        # Get all expired events
        expired_events = db.scalars(
            select(Event).where(Event.end_time < cutoff_date)
        ).all()

        deleted_count = 0

        for event in expired_events:
            logger.info(
                f"Deleting expired event: {event.name} (ID: {event.id})")

            # Delete event URLs
            db.execute(delete(EventURL).where(EventURL.event_id == event.id))

            # Delete event video associations
            db.execute(delete(EventVideo).where(
                EventVideo.event_id == event.id))

            # Delete the event itself
            db.delete(event)
            deleted_count += 1

        db.flush()
        return deleted_count

    except SQLAlchemyError as e:
        logger.error(f"Error deleting expired events: {e}")
        raise


def save_event_videos(event: Event, video_ids: List[str], db: Session) -> None:
    """
    Save videos associated with an event

    Args:
        event: Event object
        video_ids: List of video IDs
        db: Database session
    """
    if not video_ids:
        return

    try:
        for video_id in video_ids:
            if not video_id:
                continue

            # Check if video already exists
            existing_video = db.scalars(
                select(Video).where(Video.video_url_id == video_id)
            ).one_or_none()

            if not existing_video:
                # Create new video
                new_video = Video(video_url_id=video_id)
                db.add(new_video)
                db.flush()

                # Create association
                event.videos.append(new_video)
            else:
                # Check if association already exists
                if existing_video not in event.videos:
                    event.videos.append(existing_video)

    except SQLAlchemyError as e:
        logger.error(f"Error saving videos for event {event.name}: {e}")
        raise


def save_event_urls(event: Event, urls: List[str], db: Session) -> None:
    """
    Save URLs associated with an event

    Args:
        event: Event object
        urls: List of URLs
        db: Database session
    """
    if not urls:
        return

    try:
        # Delete existing URLs for this event
        db.execute(delete(EventURL).where(EventURL.event_id == event.id))

        # Get live stream URL to check for duplicates
        live_stream_url = event.live_stream_url

        # Add new URLs
        for url in urls:
            if not url:
                continue

            # Skip URLs that are the same as the live stream URL
            if live_stream_url and url == live_stream_url:
                logger.info(
                    f"Skipping URL that matches live stream URL for event {event.name}: {url}")
                continue

            new_url = EventURL(url=url, event=event)
            db.add(new_url)

    except SQLAlchemyError as e:
        logger.error(f"Error saving URLs for event {event.name}: {e}")
        raise


async def batch_save_events(events: List[Dict[str, Any]], batch_size: int = 10) -> Tuple[int, int, int]:
    """
    Save events to database in batches with error handling

    Args:
        events: List of event dictionaries
        batch_size: Number of events to save in each batch

    Returns:
        Tuple of (saved_count, updated_count, error_count)
    """
    total_events = len(events)
    saved_count = 0
    updated_count = 0
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
            for event_data in batch:
                try:
                    name = event_data.get('name')
                    start_date = event_data.get('start_date')

                    if not name or not start_date:
                        logger.warning(
                            f"Skipping event with missing name or start date: {event_data}")
                        continue

                    # Check if event already exists
                    existing_event = check_event_exist(name, start_date, db)

                    if existing_event:
                        # Update existing event
                        existing_event.description = event_data.get(
                            'description')
                        existing_event.end_time = event_data.get('end_date')
                        existing_event.logo_url = event_data.get(
                            'cover_image_url', '')
                        existing_event.live_stream_url = event_data.get(
                            'live_stream_url')

                        # Update related data
                        save_event_videos(
                            existing_event, event_data.get('videos', []), db)
                        save_event_urls(
                            existing_event, event_data.get('urls', []), db)

                        updated_count += 1
                    else:
                        # Create new event
                        new_event = Event(
                            name=name,
                            description=event_data.get('description'),
                            start_time=start_date,
                            end_time=event_data.get('end_date'),
                            logo_url=event_data.get('cover_image_url', ''),
                            live_stream_url=event_data.get('live_stream_url')
                        )

                        db.add(new_event)
                        db.flush()  # Flush to get the new event ID

                        # Save related data
                        save_event_videos(
                            new_event, event_data.get('videos', []), db)
                        save_event_urls(
                            new_event, event_data.get('urls', []), db)

                        saved_count += 1

                except Exception as e:
                    error_count += 1
                    logger.error(
                        f"Error saving event {event_data.get('name', 'Unknown')}: {e}")

    logger.info(
        f"Database update complete. Saved: {saved_count}, Updated: {updated_count}, Error: {error_count}")
    return saved_count, updated_count, error_count


async def update_events(client_id: str, client_secret: str, days_ahead: int = 90) -> None:
    """
    Update events data

    Args:
        client_id: Twitch client ID
        client_secret: Twitch client secret
        days_ahead: Number of days ahead to fetch events for
    """
    try:
        # Clean up expired events
        with db_session_manager() as db:
            deleted = delete_expired_events(db)
            logger.info(f"Deleted {deleted} expired events")

        # Fetch and update events
        handler = EventDataHandler(
            client_id=client_id, client_secret=client_secret)

        logger.info(f"Fetching events data for the next {days_ahead} days")
        events = handler.get_events(limit=500, days_ahead=days_ahead)
        logger.info(f"Retrieved {len(events)} events from API")

        saved, updated, errors = await batch_save_events(events)

        logger.info(
            f"Events update: Processed {len(events)}, Saved {saved}, Updated {updated}, Errors {errors}")

    except Exception as e:
        logger.error(f"Failed to update events data: {e}", exc_info=True)
        raise


async def main() -> None:
    """
    Main function to run event update task
    """
    load_dotenv()
    client_id = getenv('TWITCH_CLIENT_ID')
    client_secret = getenv('TWITCH_SECRET_ID')

    if not client_id or not client_secret:
        logger.error(
            "Missing environment variables. Make sure TWITCH_CLIENT_ID and TWITCH_SECRET_ID are set.")
        return

    try:
        await update_events(client_id, client_secret)
        logger.info("Event data update completed successfully")
    except Exception as e:
        logger.error(f"Main update process failed: {e}", exc_info=True)


if __name__ == '__main__':
    asyncio.run(main())
