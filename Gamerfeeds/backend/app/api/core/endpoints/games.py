from typing import Any, List
from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.orm import Session, selectinload
from app.api.db_setup import get_db

from app.api.core.models import (
    Game, GameDataType, Genre,
    Platform, Developer, Language,
    Screenshot, Video
)

from app.api.core.schemas import (
    GameSchema, DeveloperSchema, DeveloperResponseSchema,
    PlatformSchema, PlatformResponseSchema,
    LanguageSchema, LanguageResponseSchema,
    GenreSchema, GenreResponseSchema,
    ScreenshotSchema, ScreenshotResponseSchema,
    VideoSchema, VideoResponseSchema, GameResponseSchema
)

router = APIRouter(tags=['games'])


@router.get('/games', status_code=status.HTTP_200_OK)
def get_all_games(db: Session = Depends(get_db)):
    query = (select(Game)
             .join(GameDataType, GameDataType.id == Game.data_type_id)
             .options(selectinload(Game.platforms))
             .options(selectinload(Game.developers))
             .options(selectinload(Game.genres))
             .options(selectinload(Game.languages))
             .options(selectinload(Game.screenshots))
             .options(selectinload(Game.videos)))

    games = db.scalars(query).all()

    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No games found')

    all_games = []
    for game in games:
        game_dict = {
            'id': game.id,
            'name': game.name,
            'summary': game.summary,
            'storyline': game.storyline,
            'cover_image_url': game.cover_image_url,
            'release_date': game.release_date,
            'data_type': game.data_type.name,
            'developers': [developer.name for developer in game.developers],
            'platforms': [platform.name for platform in game.platforms],
            'genres': [genre.name for genre in game.genres],
            'languages': [language.name for language in game.languages],
            'screenshots': [screenshot.screenshot_url for screenshot in game.screenshots],
            'videos': [video.video_url for video in game.videos],
            'rating': game.rating
        }
        all_games.append(game_dict)

    return all_games


@router.get('/games/{id}', status_code=status.HTTP_200_OK)
def get_game_by_id(id: int, db: Session = Depends(get_db)):
    query = (select(Game)
             .join(GameDataType, GameDataType.id == Game.data_type_id)
             .options(selectinload(Game.platforms))
             .options(selectinload(Game.developers))
             .options(selectinload(Game.genres))
             .options(selectinload(Game.languages))
             .options(selectinload(Game.screenshots))
             .options(selectinload(Game.videos))
             .where(Game.id == id))

    game = db.scalars(query).first()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No game found')

    result = [{
        'id': game.id,
        'name': game.name,
        'summary': game.summary,
        'storyline': game.storyline,
        'cover_image_url': game.cover_image_url,
        'release_date': game.release_date,
        'data_type': game.data_type.name,
        'developers': [developer.name for developer in game.developers],
        'platforms': [platform.name for platform in game.platforms],
        'genres': [genre.name for genre in game.genres],
        'languages': [language.name for language in game.languages],
        'screenshots': [screenshot.screenshot_url for screenshot in game.screenshots],
        'videos': [video.video_url for video in game.videos],
        'rating': game.rating
    }]

    return result


@router.post('/games', status_code=status.HTTP_201_CREATED)
def add_game(game: GameSchema, db: Session = Depends(get_db)):
    exist_game = db.scalars(select(Game).where(
        Game.name == game.name)).one_or_none()

    if exist_game:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail='Game already exist')

    data_type_id = db.scalars(select(GameDataType.id).where(
        GameDataType.name == game.data_type)).one_or_none()

    if not data_type_id:
        new_data_type = GameDataType(name=game.data_type)
        db.add(new_data_type)
        db.flush()  # Flush to get the ID without committing
        data_type_id = new_data_type.id

    new_game = Game(**game.model_dump(exclude={'data_type', 'developers',
                                               'platforms', 'languages', 'genres', 'screenshots', 'videos'}), data_type_id=data_type_id)
    if game.developers:
        new_game.developers = get_or_create_related_objects(
            db, Developer, game.developers)

    if game.platforms:
        new_game.platforms = get_or_create_related_objects(
            db, Platform, game.platforms)

    if game.languages:
        new_game.languages = get_or_create_related_objects(
            db, Language, game.languages)

    if game.genres:
        new_game.genres = get_or_create_related_objects(
            db, Genre, game.genres)

    if game.screenshots:
        new_game.screenshots = get_or_create_related_objects(
            db, Screenshot, game.screenshots, unique_field='screenshot_url')

    if game.videos:
        new_game.videos = get_or_create_related_objects(
            db, Video, game.videos, unique_field='video_url')

    db.add(new_game)
    db.commit()
    db.refresh(new_game)

    return new_game


@router.put('/games/{id}', status_code=status.HTTP_200_OK, response_model=GameResponseSchema)
def update_game(id: int, game_update: GameSchema, db: Session = Depends(get_db)):
    query = (select(Game)
             .join(GameDataType, GameDataType.id == Game.data_type_id)
             .options(selectinload(Game.platforms))
             .options(selectinload(Game.developers))
             .options(selectinload(Game.genres))
             .options(selectinload(Game.languages))
             .options(selectinload(Game.screenshots))
             .options(selectinload(Game.videos))
             .where(Game.id == id))

    exist_game = db.scalars(query).first()

    if not exist_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No game found')

    update_game = game_update.model_dump(
        exclude={'developers', 'platforms', 'languages', 'genres', 'screenshots', 'videos', 'data_type'}, exclude_unset=True)

    if update_game:
        for key, value in update_game.items():
            setattr(exist_game, key, value)

    exist_data_type = db.scalars(select(GameDataType).where(
        GameDataType.name == game_update.data_type)).first()

    if not exist_data_type:
        exist_data_type = GameDataType(name=game_update.data_type)
        db.add(exist_data_type)
        db.flush()

    exist_game.data_type_id = exist_data_type.id

    if game_update.developers:
        exist_game.developers = get_or_create_related_objects(
            db, Developer, game_update.developers)

    if game_update.platforms:
        exist_game.platforms = get_or_create_related_objects(
            db, Platform, game_update.platforms)

    if game_update.languages:
        exist_game.languages = get_or_create_related_objects(
            db, Language, game_update.languages)

    if game_update.genres:
        exist_game.genres = get_or_create_related_objects(
            db, Genre, game_update.genres)

    if game_update.screenshots:
        exist_game.screenshots = get_or_create_related_objects(
            db, Screenshot, game_update.screenshots, unique_field='screenshot_url')

    if game_update.videos:
        exist_game.videos = get_or_create_related_objects(
            db, Video, game_update.videos, unique_field='video_url')

    db.add(exist_game)
    db.commit()
    db.refresh(exist_game)

    return exist_game

# Helper function that gets the related objects to a game or create a new relation if needed


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


@router.get('/games/topgames/', status_code=status.HTTP_200_OK)
def get_top_games(db: Session = Depends(get_db)):
    top_games = get_games_by_data_type(db=db, data_type='top')

    if not top_games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No games found')

    return top_games


@router.get('/games/latestgames', status_code=status.HTTP_200_OK)
def get_latest_games(db: Session = Depends(get_db)):
    latest_games = get_games_by_data_type(db=db, data_type='latest')

    if not latest_games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No games found')

    return latest_games


@router.get('/games/upcominggames', status_code=status.HTTP_200_OK)
def get_upcoming_games(db: Session = Depends(get_db)):
    upcoming_games = get_games_by_data_type(db=db, data_type='upcoming')

    if not upcoming_games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No games found')

    return upcoming_games


# Helper function to get game data to avoid code repitition
def get_games_by_data_type(db: Session, data_type: str):
    query = (select(Game)
             .join(GameDataType, GameDataType.id == Game.data_type_id)
             .options(selectinload(Game.platforms))
             .options(selectinload(Game.developers))
             .options(selectinload(Game.genres))
             .options(selectinload(Game.languages))
             .options(selectinload(Game.screenshots))
             .options(selectinload(Game.videos))
             .where(GameDataType.name == data_type))

    games = db.scalars(query).all()

    result = []
    for game in games:
        game_dict = {
            'id': game.id,
            'name': game.name,
            'summary': game.summary,
            'storyline': game.storyline,
            'cover_image_url': game.cover_image_url,
            'release_date': game.release_date,
            'data_type': game.data_type.name,
            'developers': [developer.name for developer in game.developers],
            'platforms': [platform.name for platform in game.platforms],
            'genres': [genre.name for genre in game.genres],
            'languages': [language.name for language in game.languages],
            'screenshots': [screenshot.screenshot_url for screenshot in game.screenshots],
            'videos': [video.video_url for video in game.videos],
            'rating': game.rating
        }
        result.append(game_dict)

    return result


@router.delete('/games/{id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_game(id: int, db: Session = Depends(get_db)):
    exist_game = db.scalars(select(Game).where(Game.id == id)).first()
    if not exist_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No game found')

    db.execute(delete(Game).where(Game.id == id))
    db.commit()

    return {'message': f'Game with id: {id} has been deleted'}


@router.get('/games/developers', status_code=status.HTTP_200_OK)
def get_all_developers(db: Session = Depends(get_db)):
    all_developers = db.scalars(select(Developer)).all()
    if not all_developers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No developers found')

    return all_developers


@router.post('/games/developers', status_code=status.HTTP_201_CREATED, response_model=DeveloperResponseSchema)
def add_developer(developer: DeveloperSchema, db: Session = Depends(get_db)):
    exist_developer = db.scalars(select(Developer).where(
        Developer.name == developer.name)).one_or_none()

    if exist_developer:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Developer already exist')
    new_developer = Developer(**developer.model_dump())
    db.add(new_developer)
    db.commit()

    return new_developer


@router.get('/games/platforms', status_code=status.HTTP_200_OK)
def get_all_platforms(db: Session = Depends(get_db)):
    all_platforms = db.scalars(select(Platform)).all()
    if not all_platforms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No platforms found')

    return all_platforms


@router.post('/games/platforms', status_code=status.HTTP_201_CREATED, response_model=PlatformResponseSchema)
def add_platform(platform: PlatformSchema, db: Session = Depends(get_db)):
    exist_platform = db.scalars(select(Platform).where(
        Platform.name == platform.name)).one_or_none()

    if exist_platform:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Platform already exist')
    new_platform = Developer(**platform.model_dump())
    db.add(new_platform)
    db.commit()

    return new_platform


@router.get('/games/languages', status_code=status.HTTP_200_OK)
def get_all_platforms(db: Session = Depends(get_db)):
    all_languages = db.scalars(select(Language)).all()
    if not all_languages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No languages found')

    return all_languages


@router.post('/games/languages', status_code=status.HTTP_201_CREATED, response_model=LanguageResponseSchema)
def add_language(language: LanguageSchema, db: Session = Depends(get_db)):
    exist_language = db.scalars(select(Language).where(
        Language.name == language.name)).one_or_none()

    if exist_language:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Language already exist')
    new_language = Language(**language.model_dump())
    db.add(new_language)
    db.commit()

    return new_language


@router.get('/games/genres', status_code=status.HTTP_200_OK)
def get_all_genres(db: Session = Depends(get_db)):
    all_genres = db.scalars(select(Genre)).all()
    if not all_genres:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No genres found')

    return all_genres


@router.post('/games/genres', status_code=status.HTTP_201_CREATED, response_model=GenreResponseSchema)
def add_genre(genre: GenreSchema, db: Session = Depends(get_db)):
    exist_genre = db.scalars(select(Genre).where(
        Genre.name == genre.name)).one_or_none()

    if exist_genre:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Genre already exist')
    new_genre = Genre(**genre.model_dump())
    db.add(new_genre)
    db.commit()

    return new_genre


@router.get('/games/screenshots', status_code=status.HTTP_200_OK)
def get_all_screenshots(db: Session = Depends(get_db)):
    all_screenshots = db.scalars(select(Screenshot)).all()
    if not all_screenshots:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No screenshots found')

    return all_screenshots


@router.post('/games/screenshots', status_code=status.HTTP_201_CREATED, response_model=ScreenshotResponseSchema)
def add_screenshot(screenshot: ScreenshotSchema, db: Session = Depends(get_db)):
    exist_screenshot = db.scalars(select(Screenshot).where(
        Screenshot.screenshot_url == screenshot.screenshot_url)).one_or_none()

    if exist_screenshot:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Screenshot already exist')
    new_screenshot = Screenshot(**screenshot.model_dump())
    db.add(new_screenshot)
    db.commit()

    return new_screenshot


@router.get('/games/videos', status_code=status.HTTP_200_OK)
def get_all_videos(db: Session = Depends(get_db)):
    all_videos = db.scalars(select(Video)).all()
    if not all_videos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No videos found')

    return all_videos


@router.post('/games/videos', status_code=status.HTTP_201_CREATED, response_model=VideoResponseSchema)
def add_video(video: VideoSchema, db: Session = Depends(get_db)):
    exist_video = db.scalars(select(Video).where(
        Video.video_url == video.video_url)).one_or_none()

    if exist_video:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Video already exist')
    new_video = Screenshot(**video.model_dump())
    db.add(new_video)
    db.commit()

    return new_video
