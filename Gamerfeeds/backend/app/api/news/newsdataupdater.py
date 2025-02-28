import logging
from logging.handlers import RotatingFileHandler
from os import getenv
from dotenv import load_dotenv
from requests import RequestException
from openai import OpenAIError
from sqlalchemy import select
from app.api.db_setup import get_db
from app.api.core.models import News, Authors, SourceNames
from app.api.news.newsdatahandler import NewsDataHandler


def add_author(name: str, db=next(get_db())):
    new_author = db.scalars(select(Authors.id).where(
        Authors.name == name)).one_or_none()
    if new_author:
        return new_author
    new_author = Authors(name=name)
    db.add(new_author)
    db.commit()
    db.refresh(new_author)

    return new_author.id


def add_source_name(name: str, db=next(get_db())):
    new_source_name = db.scalars(select(SourceNames.id).where(
        SourceNames.name == name)).one_or_none()
    if new_source_name:
        return new_source_name
    new_source_name = SourceNames(name=name)
    db.add(new_source_name)
    db.commit()
    db.refresh(new_source_name)

    return new_source_name.id


def update_news_data(api_key: str, openai_key, db=next(get_db())):
    # Create a logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.ERROR)

    # Create rotating file handler (10MB max, keep 5 backup files)
    handler = RotatingFileHandler(
        'error_log.txt',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    handler.setLevel(logging.ERROR)

    # Create formatter and add it to the handler
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    # Add handler to the logger
    logger.addHandler(handler)

    try:
        query = 'gaming OR video games'
        domains = 'ign.com,kotaku.com,polygon.com,gamespot.com,pcgamer.com,gameinformer.com'
        newsData = NewsDataHandler(
            api_key=api_key, openai_key=openai_key, query=query, domains=domains, pageSize=5)
        articles = newsData.fetch_game_news()
        updated_news = newsData.export_news_data(articles=articles)

        for news in updated_news:
            check_url = db.scalars(select(News.id).where(
                News.source_url == news['url'])).one_or_none()

            if check_url or not news['urlToImage']:
                continue

            author_id = add_author(news['author'])
            source_id = add_source_name(news['sourceName'])
            article = News(
                title=news['title'],
                description=news['description'],
                author_id=author_id,
                image_url=news['urlToImage'],
                source_url=news['url'],
                source_id=source_id,
                content=news['content'],
                published=news['publishedAt']
            )

            db.add(article)
            db.commit()
            db.flush()

        print('Successfully updated the database')

    except (RequestException, OpenAIError):
        logger.exception("An error occurred")  # Includes traceback


if __name__ == '__main__':
    load_dotenv()
    api_key = getenv('NEWS_API_KEY')
    openai_key = getenv('OPENAI_KEY')
    update_news_data(api_key, openai_key)
