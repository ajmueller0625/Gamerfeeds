from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy import insert, select, update, delete
from sqlalchemy.orm import Session, joinedload, selectinload
from app.api.db_setup import get_db

from app.api.core.models import Authors, SourceNames, News

from app.api.core.schemas import (
    NewsSchema, NewsResponseSchema,
    AuthorSchema, AuthorResponseSchema,
    SourceNameSchema, SourceNameResponseSchema
)

router = APIRouter(tags=['news'])


@router.get('/news', status_code=status.HTTP_200_OK)
def get_all_news(db: Session = Depends(get_db)):
    all_news = db.scalars(select(News)).all()
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

    try:
        add_author(news.author)
    except HTTPException:
        author_id = db.scalars(select(Authors.id).where(
            Authors.name == news.author)).first()

    try:
        add_source_name(news.source_name)
    except HTTPException:
        source_id = db.scalars(select(SourceNames.id).where(
            SourceNames.name == news.source_name)).first()

    new_news = News(
        **news.model_dump(exclude={'author', 'source_name'}), author_id=author_id, source_name_id=source_id)
    db.add(new_news)
    db.commit()

    return new_news


@router.get('/news/authors',  status_code=status.HTTP_200_OK)
def get_all_authors(db: Session = Depends(get_db)):
    all_authors = db.scalars(select(Authors)).all()
    if not all_authors:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No authors found')
    return all_authors


@router.get('/news/authors/{id}', status_code=status.HTTP_200_OK, response_model=AuthorResponseSchema)
def get_author_by_id(id: int, db: Session = Depends(get_db)):
    author = db.scalars(select(Authors).where(Authors.id == id)).one_or_none()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No author found')
    return author


@router.post('/news/authors', status_code=status.HTTP_201_CREATED, response_model=AuthorResponseSchema)
def add_author(author: AuthorSchema, db: Session = Depends(get_db)):
    new_author = db.scalars(select(Authors).where(
        Authors.name == author.name)).one_or_none()
    if new_author:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Author already exist')
    new_author = Authors(**author.model_dump())
    db.add(new_author)
    db.commit()
    db.refresh(new_author)

    return new_author


@router.get('news/sources/names', status_code=status.HTTP_200_OK)
def get_all_source_names(db: Session = Depends(get_db)):
    all_sources_names = db.scalars(select(SourceNames)).all()
    if not all_sources_names:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No sources found')
    return all_sources_names


@router.get('/news/sources/names/{id}', status_code=status.HTTP_200_OK, response_model=SourceNameResponseSchema)
def get_source_name_by_id(id: int, db: Session = Depends(get_db)):
    source_name = db.scalars(select(SourceNames).where(
        SourceNames.id == id)).one_or_none()
    if not source_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No source found')
    return source_name


@router.post('/news/sources/names', status_code=status.HTTP_201_CREATED, response_model=SourceNameResponseSchema)
def add_source_name(source_name: SourceNameSchema, db: Session = Depends(get_db)):
    new_source_name = db.scalars(select(SourceNames).where(
        SourceNames.name == source_name.name))
    if new_source_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail='Source already exist')
    new_source_name = SourceNames(**source_name.model_dump())
    db.add(new_source_name)
    db.commit()
    db.refresh(new_source_name)

    return new_source_name
