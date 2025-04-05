from fastapi import Depends, APIRouter, HTTPException, status, Query
from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, Dict, Any
from app.api.db_setup import get_db

from app.api.core.models import (
    Game, GameDataType, News, Author, SourceName
)

router = APIRouter(tags=['search'])


@router.get('/search', status_code=status.HTTP_200_OK)
def search(
    db: Session = Depends(get_db),
    query: str = Query(..., min_length=1, description='Search query'),
    type: str = Query(
        None, description='Type of content to search (games, news, or all)'),
    page: int = Query(1, ge=1, description='Page number'),
    perPage: int = Query(10, ge=1, le=100, description='Items per page')
):
    """
    Search endpoint that can search across games and news.
    Can be filtered by type (games, news, or all).
    Returns paginated results.
    """
    # Set default type to 'all' if not specified
    if type not in ['games', 'news', 'all']:
        type = 'all'

    # Calculate pagination
    skip = (page - 1) * perPage

    results = []
    total_items = 0

    # Search in games
    if type in ['games', 'all']:
        games_query = (
            select(Game)
            .join(GameDataType, GameDataType.id == Game.data_type_id)
            .options(selectinload(Game.platforms))
            .options(selectinload(Game.developers))
            .options(selectinload(Game.genres))
            .options(selectinload(Game.languages))
            .options(selectinload(Game.screenshots))
            .options(selectinload(Game.videos))
            .where(or_(
                Game.name.ilike(f'%{query}%'),
                Game.summary.ilike(f'%{query}%'),
                Game.storyline.ilike(f'%{query}%')
            ))
            .order_by(Game.name)
        )

        # Count total matching games
        games_count_query = select(
            func.count()).select_from(games_query.subquery())
        games_total = db.scalar(games_count_query) or 0
        total_items += games_total

        # Get games for current page
        if type == 'all':
            # If searching both, calculate how many to get from each
            games_limit = min(perPage // 2, games_total)
            games_skip = min(skip, games_total)
        else:
            # If searching only games, use full pagination
            games_limit = perPage
            games_skip = skip

        if games_limit > 0:
            games = db.scalars(games_query.offset(
                games_skip).limit(games_limit)).all()

            for game in games:
                results.append({
                    'id': game.id,
                    'type': 'game',
                    'name': game.name,
                    'summary': game.summary,
                    'image_url': game.cover_image_url,
                    'release_date': game.release_date,
                    'data_type': game.data_type.name,
                    'developers': [developer.name for developer in game.developers],
                    'platforms': [platform.name for platform in game.platforms],
                    'rating': game.rating
                })

    # Search in news
    if type in ['news', 'all']:
        news_query = (
            select(News)
            .options(selectinload(News.author))
            .options(selectinload(News.source_name))
            .where(or_(
                News.title.ilike(f'%{query}%'),
                News.description.ilike(f'%{query}%'),
                News.content.ilike(f'%{query}%')
            ))
            .order_by(News.published.desc())
        )

        # Count total matching news
        news_count_query = select(
            func.count()).select_from(news_query.subquery())
        news_total = db.scalar(news_count_query) or 0
        total_items += news_total

        # Get news for current page
        if type == 'all':
            # If searching both, calculate remaining items to get
            news_limit = perPage - min(perPage // 2, games_total)
            news_skip = max(0, skip - games_total) if skip > games_total else 0
        else:
            # If searching only news, use full pagination
            news_limit = perPage
            news_skip = skip

        if news_limit > 0:
            news_items = db.scalars(news_query.offset(
                news_skip).limit(news_limit)).all()

            for news in news_items:
                results.append({
                    'id': news.id,
                    'type': 'news',
                    'title': news.title,
                    'description': news.description,
                    'image_url': news.image_url,
                    'author': news.author.name,
                    'source_name': news.source_name.name,
                    'published': news.published
                })

    # Calculate total pages based on total matching items
    total_pages = (total_items + perPage - 1) // perPage

    # If no results found
    if not results:
        return {
            'items': [],
            'pagination': {
                'page': page,
                'perPage': perPage,
                'total_items': 0,
                'total_pages': 0
            }
        }

    return {
        'items': results,
        'pagination': {
            'page': page,
            'perPage': perPage,
            'total_items': total_items,
            'total_pages': total_pages
        }
    }
