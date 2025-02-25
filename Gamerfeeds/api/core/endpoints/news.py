from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy import insert, select, update, delete
from sqlalchemy.orm import Session, joinedload, selectinload
from api.db_setup import get_db

from api.core.models import Authors, SourceNames, News

from api.core.schemas import NewsSchema, NewsResponseSchema

router = APIRouter(tags=['News'])


@router.get('/news', status_code=200)
def get_all_news(db: Session = Depends(get_db)):
    all_news = db.scalars(select(News).all())
    if not all_news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No news found')
    return all_news


@router.post('/news', status_code=status.HTTP_201_CREATED, response_model=NewsResponseSchema)
def add_news(news: NewsSchema, db: Session = Depends(get_db)):
    url = db.scalars(select(News).where(
        News.source_url == news.source_url)).one_or_none()
    if url:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='The news already exist in the database')

    else:
        author = db.scalars(select(Authors).where(
            Authors.name == news.author)).one_or_none()
        if not author:
            new_author = Authors(name=news.author)
            db.add(new_author)
            db.commit()

        source_name = db.scalars(select(SourceNames).where(
            SourceNames.name == news.source_name)).one_or_none()
        if not source_name:
            new_source_name = SourceNames(name=news.source_name)
            db.add(new_source_name)
            db.commit()

        author_id = db.scalars(select(Authors.id).where(
            Authors.name == news.author)).first()
        source_id = db.scalars(select(SourceNames.id).where(
            SourceNames.name == news.source_name)).first()

        new_news = News(
            title=news.title,
            description=news.description,
            image_url=news.image_url,
            source_url=news.source_url,
            content=news.content,
            published=news.published,
            author_id=author_id,
            source_name_id=source_id
        )

        db.add(new_news)
        db.commit()

        return new_news
