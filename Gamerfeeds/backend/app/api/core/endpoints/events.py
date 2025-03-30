from datetime import datetime
from typing import Any, List
from fastapi import Depends, APIRouter, HTTPException, status, Query
from sqlalchemy import func, select, delete, desc, asc, case
from sqlalchemy.orm import Session, selectinload
from app.api.db_setup import get_db

from app.api.core.models import (
    Event, Game, GameDataType,
    Video
)

from app.api.core.schemas import (
    EventSchema, EventResponseSchema
)

router = APIRouter(tags=['events'])


@router.get('/events', status_code=status.HTTP_200_OK)
def get_all_events(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description='Page number'),
    perPage: int = Query(10, ge=1, le=100, description='Items per page'),
    game_id: int = Query(None, description='Filter events by game id'),
    active: bool = Query(
        None, description='Filter for active (true) or upcoming (false) events')
):
    events = get_events_with_pagination(
        db=db, page=page, perPage=perPage, game_id=game_id, is_active=active)

    if not events.get('items'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No events found')

    return events


@router.post('/events', status_code=status.HTTP_201_CREATED, response_model=EventResponseSchema)
def add_event(event: EventSchema, db: Session = Depends(get_db)):
    exist_event = db.scalars(select(Event).where(
        Event.name == event.name).where(
        Event.start_date == event.start_date)).one_or_none()

    if exist_event:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail='Event already exists')

    # Get or create data type
    data_type_id = db.scalars(select(GameDataType.id).where(
        GameDataType.name == event.data_type)).one_or_none()

    if not data_type_id:
        new_data_type = GameDataType(name=event.data_type)
        db.add(new_data_type)
        db.flush()  # Flush to get the ID without committing
        data_type_id = new_data_type.id

    # Create the event
    new_event = Event(**event.model_dump(
        exclude={'data_type', 'games', 'videos'}),
        data_type_id=data_type_id)

    # Add relationships
    if event.games:
        games = []
        for game_id in event.games:
            game = db.get(Game, game_id)
            if game:
                games.append(game)
        new_event.games = games

    if event.videos:
        new_event.videos = get_or_create_related_objects(
            db, Video, event.videos, unique_field='video_url_id')

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.get('/events/{id}', status_code=status.HTTP_200_OK)
def get_event_by_id(id: int, db: Session = Depends(get_db)):
    query = (select(Event)
             .join(GameDataType, GameDataType.id == Event.data_type_id)
             .options(selectinload(Event.games))
             .options(selectinload(Event.videos))
             .where(Event.id == id))

    event = db.scalars(query).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No event found')

    result = {
        'id': event.id,
        'name': event.name,
        'description': event.description,
        'cover_image_url': event.cover_image_url,
        'start_date': event.start_date,
        'end_date': event.end_date,
        'website_url': event.website_url,
        'location': event.location,
        'event_type': event.event_type,
        'data_type': event.data_type.name,
        'games': [{'id': game.id, 'name': game.name} for game in event.games],
        'videos': [video.video_url_id for video in event.videos]
    }

    return result


@router.put('/events/{id}', status_code=status.HTTP_200_OK, response_model=EventResponseSchema)
def update_event(id: int, event_update: EventSchema, db: Session = Depends(get_db)):
    query = (select(Event)
             .join(GameDataType, GameDataType.id == Event.data_type_id)
             .options(selectinload(Event.games))
             .options(selectinload(Event.videos))
             .where(Event.id == id))

    exist_event = db.scalars(query).first()

    if not exist_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No event found')

    # Update event fields
    update_data = event_update.model_dump(
        exclude={'games', 'videos', 'data_type'}, exclude_unset=True)

    for key, value in update_data.items():
        setattr(exist_event, key, value)

    # Update data type
    exist_data_type = db.scalars(select(GameDataType).where(
        GameDataType.name == event_update.data_type)).first()

    if not exist_data_type:
        exist_data_type = GameDataType(name=event_update.data_type)
        db.add(exist_data_type)
        db.flush()

    exist_event.data_type_id = exist_data_type.id

    # Update relationships
    if event_update.games is not None:
        games = []
        for game_id in event_update.games:
            game = db.get(Game, game_id)
            if game:
                games.append(game)
        exist_event.games = games

    if event_update.videos is not None:
        exist_event.videos = get_or_create_related_objects(
            db, Video, event_update.videos, unique_field='video_url_id')

    db.add(exist_event)
    db.commit()
    db.refresh(exist_event)

    return exist_event


@router.delete('/events/{id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_event(id: int, db: Session = Depends(get_db)):
    exist_event = db.scalars(select(Event).where(Event.id == id)).first()
    if not exist_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No event found')

    db.execute(delete(Event).where(Event.id == id))
    db.commit()

    return {'message': f'Event with id: {id} has been deleted'}


# Helper function to get event data with pagination
def get_events_with_pagination(page: int, perPage: int, db: Session, game_id: int = None, is_active: bool = None):
    # Initial query
    query = (select(Event)
             .join(GameDataType, GameDataType.id == Event.data_type_id)
             .options(selectinload(Event.games))
             .options(selectinload(Event.videos)))

    # Apply game filter
    if game_id:
        query = query.join(Event.games).where(Game.id == game_id)

    # Apply active/inactive filter if specified
    if is_active is not None:
        now = datetime.now()
        if is_active:
            # Active events = started but not ended yet
            query = query.where(Event.start_date <= now).where(
                Event.end_date >= now)
        else:
            # Upcoming events = not started yet
            query = query.where(Event.start_date > now)

    # Apply default sorting (upcoming first, then current)
    now = datetime.now()
    upcoming_case = case((Event.start_date > now, 0), else_=1)
    query = query.order_by(upcoming_case, Event.start_date)

    # Make the query distinct to avoid duplicates
    query = query.distinct()

    # Count total matching events
    count_query = select(func.count()).select_from(query.subquery())
    total_events = db.scalar(count_query)

    # Calculate pagination values
    total_pages = (total_events + perPage - 1) // perPage  # Ceiling division

    # Apply pagination
    offset_value = (page - 1) * perPage
    query = query.offset(offset_value).limit(perPage)

    # Execute and get events
    events = db.scalars(query).all()

    result = []
    for event in events:
        event_dict = {
            'id': event.id,
            'name': event.name,
            'description': event.description,
            'cover_image_url': event.cover_image_url,
            'start_date': event.start_date,
            'end_date': event.end_date,
            'website_url': event.website_url,
            'location': event.location,
            'event_type': event.event_type,
            'data_type': event.data_type.name,
            'games': [{'id': game.id, 'name': game.name} for game in event.games],
            'videos': [video.video_url_id for video in event.videos]
        }
        result.append(event_dict)

    return {
        'items': result,
        'pagination': {
            'page': page,
            'perPage': perPage,
            'total_items': total_events,
            'total_pages': total_pages
        }
    }


# Helper function for handling related objects
def get_or_create_related_objects(db: Session, model_class: Any, items: List[str], unique_field='name'):
    result = []

    for item in items:
        object = db.scalars(select(model_class).where(
            getattr(model_class, unique_field) == item)).first()

        if object:
            result.append(object)
        else:
            new_object = model_class(**{unique_field: item})
            db.add(new_object)
            db.flush()
            result.append(new_object)

    return result
