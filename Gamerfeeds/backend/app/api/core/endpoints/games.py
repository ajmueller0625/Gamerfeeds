from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy import select, delete, update
from sqlalchemy.orm import Session, joinedload, selectinload, subqueryload
from app.api.db_setup import get_db

from app.api.core.models import (
    Game, GameDataType,
    Genre, GameGenre,
    Platform, GamePlatform,
    Developer, GameDeveloper,
    Language, GameLanguage,
    Screenshot, GameScreenshot,
    Video, GameVideo
)

from app.api.core.schemas import (
    GameSchema, DeveloperSchema, DeveloperResponseSchema, GameDeveloperSchema, GameDeveloperResponseSchema,
    GameGenreSchema, PlatformSchema, PlatformResponseSchema, GamePlatformSchema, GamePlatformResponseSchema,
    LanguageSchema, LanguageResponseSchema, GameLanguageSchema, GameLanguageResponseSchema,
    GenreSchema, GenreResponseSchema, GameGenreSchema, GameGenreResponseSchema,
    ScreenshotSchema, ScreenshotResponseSchema, GameScreenshotSchema, GameScreenshotResponseSchema,
    VideoSchema, VideoResponseSchema, GameVideoSchema, GameVideoResponseSchema, GameResponseSchema
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
    db.add(new_game)
    db.flush()  # Flush to get the ID without committing

    if game.developers:
        for developer in game.developers:
            # Check if developer exists
            new_developer = db.scalars(select(Developer).where(
                Developer.name == developer)).one_or_none()
            if not new_developer:
                new_developer = Developer(name=developer)
                db.add(new_developer)
                db.flush()  # Flush to get the ID without committing
            new_game_developer = GameDeveloper(
                game_id=new_game.id, developer_id=new_developer.id)
            db.add(new_game_developer)

    if game.platforms:
        for platform in game.platforms:
            # Check if platform exists
            new_platform = db.scalars(select(Platform).where(
                Platform.name == platform)).one_or_none()
            if not new_platform:
                # Create new platform
                new_platform = Platform(name=platform)
                db.add(new_platform)
                db.flush()  # Flush to get the ID without committing
            new_game_platform = GamePlatform(
                platform_id=new_platform.id, game_id=new_game.id)
            db.add(new_game_platform)

    if game.languages:
        for language in game.languages:
            # Check if language exist
            new_language = db.scalars(select(Language).where(
                Language.name == language)).one_or_none()
            if not new_language:
                # Create new language
                new_language = Language(name=language)
                db.add(new_language)
                db.flush()  # Flush to get the ID without committing
            new_game_language = GameLanguage(
                language_id=new_language.id, game_id=new_game.id)
            db.add(new_game_language)

    if game.genres:
        for genre in game.genres:
            # Check if genre exist
            new_genre = db.scalars(select(Genre).where(
                Genre.name == genre)).one_or_none()
            if not new_genre:
                # Create new genre
                new_genre = Genre(name=genre)
                db.add(new_genre)
                db.flush()  # Flush to get the ID without committing
            new_game_genre = GameGenre(
                genre_id=new_genre.id, game_id=new_game.id)
            db.add(new_game_genre)

    if game.screenshots:
        for screenshot in game.screenshots:
            # Check if screenshot exist
            new_screenshot = db.scalars(select(Screenshot).where(
                Screenshot.screenshot_url == screenshot)).one_or_none()
            if not new_screenshot:
                # Create new screenshot
                new_screenshot = Screenshot(screenshot_url=screenshot)
                db.add(new_screenshot)
                db.flush()  # Flush to get the ID without committing
            new_game_screenshot = GameScreenshot(
                screenshot_id=new_screenshot.id, game_id=new_game.id)
            db.add(new_game_screenshot)

    if game.videos:
        for video in game.videos:
            # Check if video url exist
            new_video = db.scalars(select(Video).where(
                Video.video_url == video)).one_or_none()
            if not new_video:
                # Create new video
                new_video = Video(video_url=video)
                db.add(new_video)
                db.flush()  # Flush to get the ID without committing
            new_game_video = GameVideo(
                video_id=new_video.id, game_id=new_game.id)
            db.add(new_game_video)

    db.commit()

    return new_game


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
