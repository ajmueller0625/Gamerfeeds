from datetime import datetime
from typing import Any, List, Optional
from fastapi import Depends, APIRouter, HTTPException, status, Query
from sqlalchemy import func, select, delete, desc, asc
from sqlalchemy.orm import Session, selectinload
from app.api.db_setup import get_db

from app.api.core.models import (
    Event, EventURL, EventVideo, Video
)

# Import the schemas from the updated event schemas file
# You'll need to adjust this import path to where you put the schemas
from app.api.core.schemas import (
    EventSchema, EventResponseSchema, EventDetailResponseSchema,
    EventURLSchema, EventURLResponseSchema, EventVideoSchema
)

router = APIRouter(tags=['events'])


@router.get('/events', status_code=status.HTTP_200_OK)
def get_all_events(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description='Page number'),
    perPage: int = Query(10, ge=1, le=100, description='Items per page'),
):
    """
    Get all events with optional filtering and pagination
    """
    events = get_events_with_pagination(db=db, page=page, perPage=perPage)

    if not events.get('items'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No events found')

    return events


@router.get('/events/{id}', status_code=status.HTTP_200_OK, response_model=EventDetailResponseSchema)
def get_event_by_id(id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific event
    """
    query = (select(Event)
             .options(selectinload(Event.event_urls))
             .options(selectinload(Event.videos))
             .where(Event.id == id))

    event = db.scalars(query).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')

    # Format event URLs as a simple list of strings
    event_urls = [url.url for url in event.event_urls]

    # Format videos
    videos = [
        {
            "id": video.id,
            "video_url_id": video.video_url_id
        } for video in event.videos
    ]

    # Create response with detailed information
    return EventDetailResponseSchema(
        id=event.id,
        name=event.name,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        logo_url=event.logo_url,
        live_stream_url=event.live_stream_url,
        event_urls=event_urls,
        videos=videos
    )


@router.post('/events', status_code=status.HTTP_201_CREATED, response_model=EventResponseSchema)
def add_event(event: EventSchema, db: Session = Depends(get_db)):
    """
    Create a new event
    """
    # Check if event already exists
    exist_event = db.scalars(select(Event).where(
        Event.name == event.name).where(
        Event.start_time == event.start_time)).one_or_none()

    if exist_event:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail='Event already exists')

    # Create new event
    new_event = Event(
        name=event.name,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        logo_url=event.logo_url,
        live_stream_url=event.live_stream_url
    )

    db.add(new_event)
    db.flush()  # Get ID without committing

    # Add URLs
    if event.urls:
        for url in event.urls:
            event_url = EventURL(url=url, event=new_event)
            db.add(event_url)

    # Add videos
    if event.videos:
        video_objects = []
        for video_id in event.videos:
            video = db.scalars(select(Video).where(
                Video.video_url_id == video_id)).first()

            if not video:
                video = Video(video_url_id=video_id)
                db.add(video)
                db.flush()

            video_objects.append(video)

        new_event.videos = video_objects

    db.commit()
    db.refresh(new_event)

    return EventResponseSchema(
        id=new_event.id,
        name=new_event.name,
        description=new_event.description,
        start_time=new_event.start_time,
        end_time=new_event.end_time,
        logo_url=new_event.logo_url,
        live_stream_url=new_event.live_stream_url
    )


@router.put('/events/{id}', status_code=status.HTTP_200_OK, response_model=EventResponseSchema)
def update_event(id: int, event_update: EventSchema, db: Session = Depends(get_db)):
    """
    Update an existing event
    """
    # Find the event
    exist_event = db.scalars(select(Event).where(Event.id == id)).first()

    if not exist_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')

    # Update basic fields
    exist_event.name = event_update.name
    exist_event.description = event_update.description
    exist_event.start_time = event_update.start_time
    exist_event.end_time = event_update.end_time
    exist_event.logo_url = event_update.logo_url
    exist_event.live_stream_url = event_update.live_stream_url

    # Update URLs
    if event_update.urls is not None:
        # Remove existing URLs
        db.query(EventURL).filter(EventURL.event_id == exist_event.id).delete()

        # Add new URLs
        for url in event_update.urls:
            event_url = EventURL(url=url, event=exist_event)
            db.add(event_url)

    # Update videos
    if event_update.videos is not None:
        # Clear existing relationships
        db.query(EventVideo).filter(
            EventVideo.event_id == exist_event.id).delete()

        # Add new videos
        video_objects = []
        for video_id in event_update.videos:
            video = db.scalars(select(Video).where(
                Video.video_url_id == video_id)).first()

            if not video:
                video = Video(video_url_id=video_id)
                db.add(video)
                db.flush()

            video_objects.append(video)

        exist_event.videos = video_objects

    db.add(exist_event)
    db.commit()
    db.refresh(exist_event)

    return EventResponseSchema(
        id=exist_event.id,
        name=exist_event.name,
        description=exist_event.description,
        start_time=exist_event.start_time,
        end_time=exist_event.end_time,
        logo_url=exist_event.logo_url,
        live_stream_url=exist_event.live_stream_url
    )


@router.delete('/events/{id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_event(id: int, db: Session = Depends(get_db)):
    """
    Delete an event
    """
    exist_event = db.scalars(select(Event).where(Event.id == id)).first()
    if not exist_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')

    db.delete(exist_event)
    db.commit()

    return {'message': f'Event with id: {id} has been deleted'}


@router.post('/events/urls', status_code=status.HTTP_201_CREATED, response_model=EventURLResponseSchema)
def add_event_url(event_url: EventURLSchema, db: Session = Depends(get_db)):
    """
    Add a URL to an event
    """
    # Check if event exists
    event = db.get(Event, event_url.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')

    # Check if URL already exists for this event
    exist_url = db.scalars(select(EventURL).where(
        EventURL.event_id == event_url.event_id).where(
        EventURL.url == event_url.url)).one_or_none()

    if exist_url:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail='URL already exists for this event')

    new_url = EventURL(**event_url.model_dump())
    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    return EventURLResponseSchema(
        id=new_url.id,
        url=new_url.url,
        event_id=new_url.event_id
    )


# Helper function to get events with pagination
def get_events_with_pagination(
    db: Session,
    page: int,
    perPage: int,
    start_before: Optional[datetime] = None,
    start_after: Optional[datetime] = None,
    end_before: Optional[datetime] = None,
    end_after: Optional[datetime] = None
):
    """
    Get events with pagination and optional filtering

    Args:
        db: Database session
        page: Page number
        perPage: Items per page
        sart_before: Only include events that start before this time
        start_after: Only include events that start after this time
        end_before: Only include events that end before this time
        end_after: Only include events that end after this time
    """
    # Initial query
    query = (select(Event)
             .options(selectinload(Event.event_urls))
             .options(selectinload(Event.videos)))

    # Apply time filters
    if start_before:
        query = query.where(Event.start_time <= start_before)
    if start_after:
        query = query.where(Event.start_time >= start_after)
    if end_before:
        query = query.where(Event.end_time <= end_before)
    if end_after:
        query = query.where(Event.end_time >= end_after)

    # Add ordering - upcoming events first
    query = query.order_by(asc(Event.start_time))

    # We need distinct to avoid duplicates
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
    events = db.execute(query).scalars().all()

    result = []
    for event in events:
        # Format URLs
        urls = [url.url for url in event.event_urls]

        # Format videos
        videos = [video.video_url_id for video in event.videos]

        event_dict = {
            "id": event.id,
            "name": event.name,
            "description": event.description,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "logo_url": event.logo_url,
            "live_stream_url": event.live_stream_url,
            "urls": urls,
            "videos": videos
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
