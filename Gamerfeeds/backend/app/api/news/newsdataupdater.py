import logging
import asyncio
from typing import List, Dict, Any, Optional
from logging.handlers import RotatingFileHandler
from os import getenv
from functools import lru_cache
from contextlib import contextmanager
from datetime import datetime, timedelta

from dotenv import load_dotenv
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.api.db_setup import get_db
from app.api.core.models import News, Authors, SourceNames
from app.api.news.newsdatahandler import NewsDataHandler


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


@lru_cache(maxsize=100)
def get_author_id(name: str, db: Session) -> int:
    """
    Get or create author ID with caching for performance

    Args:
        name: Author name
        db: Database session

    Returns:
        Author ID
    """
    if not name:
        # Use a default author name for empty author fields
        name = "Unknown Author"

    try:
        # Check if author exists
        existing_author = db.scalars(select(Authors.id).where(
            Authors.name == name)).one_or_none()

        if existing_author:
            return existing_author

        # Create new author
        new_author = Authors(name=name)
        db.add(new_author)
        db.flush()  # Flush but don't commit yet

        return new_author.id
    except SQLAlchemyError as e:
        logger.error(f"Database error getting/creating author '{name}': {e}")
        raise


@lru_cache(maxsize=50)
def get_source_id(name: str, db: Session) -> int:
    """
    Get or create source ID with caching for performance

    Args:
        name: Source name
        db: Database session

    Returns:
        Source ID
    """
    if not name:
        name = "Unknown Source"

    try:
        # Check if source exists
        existing_source = db.scalars(select(SourceNames.id).where(
            SourceNames.name == name)).one_or_none()

        if existing_source:
            return existing_source

        # Create new source
        new_source = SourceNames(name=name)
        db.add(new_source)
        db.flush()  # Flush but don't commit yet

        return new_source.id
    except SQLAlchemyError as e:
        logger.error(f"Database error getting/creating source '{name}': {e}")
        raise


def check_article_exists(url: str, db: Session) -> bool:
    """
    Check if an article with the given URL already exists

    Args:
        url: Article URL
        db: Database session

    Returns:
        True if article exists, False otherwise
    """
    try:
        existing = db.scalars(select(News.id).where(
            News.source_url == url)).one_or_none()
        return existing is not None
    except SQLAlchemyError as e:
        logger.error(f"Error checking article existence for URL {url}: {e}")
        return False  # Assume it doesn't exist on error


async def batch_save_articles(articles: List[Dict[str, Any]], batch_size: int = 10):
    """
    Save articles to database in batches with error handling

    Args:
        articles: List of article dictionaries
        batch_size: Number of articles to save in each batch
    """
    total_articles = len(articles)
    saved_count = 0
    error_count = 0
    skipped_count = 0

    # Process in batches
    for i in range(0, total_articles, batch_size):
        batch = articles[i:i+batch_size]

        with db_session_manager() as db:
            for article in batch:
                try:
                    # Skip if article already exists, has no image, or has no content
                    if (check_article_exists(article['url'], db) or
                        not article.get('urlToImage') or
                            not article.get('content')):
                        skipped_count += 1
                        continue

                    # Get or create author and source
                    author_id = get_author_id(article.get('author', ''), db)
                    source_id = get_source_id(
                        article.get('sourceName', ''), db)

                    # Create new article
                    new_article = News(
                        title=article.get('title', ''),
                        description=article.get('description', ''),
                        author_id=author_id,
                        image_url=article.get('urlToImage', ''),
                        source_url=article.get('url', ''),
                        source_id=source_id,
                        content=article.get('content', ''),
                        published=article.get(
                            'publishedAt', datetime.now().isoformat())
                    )

                    db.add(new_article)
                    saved_count += 1

                except Exception as e:
                    error_count += 1
                    logger.error(
                        f"Error saving article {article.get('title', 'Unknown')}: {e}")

    logger.info(
        f"Database update complete. Saved: {saved_count}, Skipped: {skipped_count}, Errors: {error_count}")
    return saved_count, skipped_count, error_count


async def update_news_data(api_key: str, openai_key: str):
    """
    Main function to update news data asynchronously

    Args:
        api_key: NewsAPI key
        openai_key: OpenAI API key
    """
    try:
        # Define gaming news sources
        query = 'gaming OR video games'
        domains = 'ign.com,kotaku.com,polygon.com,gamespot.com,pcgamer.com,gameinformer.com'

        logger.info(f"Fetching gaming news from {domains}")

        # Create handler with the optimized class
        news_handler = NewsDataHandler(
            api_key=api_key,
            openai_key=openai_key,
            query=query,
            domains=domains,
            pageSize=50,
            max_workers=5
        )

        # Process news data asynchronously
        articles = await news_handler.process_news_data_async()

        # Save articles to database in batches
        saved, skipped, errors = await batch_save_articles(articles)

        logger.info(
            f"Gaming news update: Processed {len(articles)}, Saved {saved}, Skipped {skipped}, Errors {errors}")
        logger.info(
            f"Successfully updated the database with {len(articles)} articles")

    except Exception as e:
        logger.error(f"Failed to update news data: {e}", exc_info=True)
        raise


async def main():
    load_dotenv()
    api_key = getenv('NEWS_API_KEY')
    openai_key = getenv('OPENAI_KEY')

    if not api_key or not openai_key:
        logger.error("Missing required API keys in environment variables")
        return

    # Run the update process focused only on gaming news
    await update_news_data(api_key, openai_key)


if __name__ == '__main__':
    # Run the async main function
    asyncio.run(main())
