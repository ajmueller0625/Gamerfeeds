from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy import select, delete, update
from sqlalchemy.orm import Session
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
    VideoSchema, VideoResponseSchema, GameVideoSchema, GameVideoResponseSchema
)

router = APIRouter(tags=['games'])


@router.get('/games', status_code=status.HTTP_200_OK)
def get_all_games(db: Session = Depends(get_db)):
    all_games = db.scalars(select(Game)).all()
    if not all_games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail='No games found')
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
        data_type_id = new_data_type.id

    new_game = Game(**game.model_dump(exclude={'data_type', 'developers',
                                               'platforms', 'languages', 'genres', 'screenshots', 'videos'}), data_type_id=data_type_id)
    db.add(new_game)
    db.flush()  # Flush to get the ID without committing

    if game.developers:
        for developer in game.developers:
            # Check if developer exists
            exist_developer = db.scalars(select(Developer).where(
                Developer.name == developer)).one_or_none()
            if exist_developer:
                developer_id = exist_developer.id
            else:
                # Create new developer
                new_developer = Developer(name=developer)
                db.add(new_developer)
                db.flush()  # Flush to get the ID without committing
                developer_id = new_developer.id
            new_game_developer = GameDeveloper(
                game_id=new_game.id, developer_id=developer_id)
            db.add(new_game_developer)

    if game.platforms:
        for platform in game.platforms:
            # Check if platform exists
            exist_platform = db.scalars(select(Platform).where(
                Platform.name == platform)).one_or_none()
            if exist_platform:
                platform_id = exist_platform.id
            else:
                # Create new platform
                new_platform = Platform(name=platform)
                db.add(new_platform)
                db.flush()  # Flush to get the ID without committing
                platform_id = new_platform.id
            new_game_platform = GamePlatform(
                game_id=new_game.id, platform_id=platform_id)
            db.add(new_game_platform)

    if game.languages:
        for language in game.languages:
            # Check if language exist
            exist_language = db.scalars(select(Language).where(
                Language.name == language)).one_or_none()
            if exist_language:
                language_id = exist_language.id
            else:
                # Create new language
                new_language = Language(name=language)
                db.add(new_language)
                db.flush()  # Flush to get the ID without committing
                language_id = new_language.id
            new_game_language = GameLanguage(
                game_id=new_game.id, language_id=language_id)
            db.add(new_game_language)

    if game.genres:
        for genre in game.genres:
            # Check if genre exist
            exist_genre = db.scalars(select(Genre).where(
                Genre.name == genre)).one_or_none()
            if exist_genre:
                genre_id = exist_genre.id
            else:
                # Create new genre
                new_genre = Genre(name=genre)
                db.add(new_genre)
                db.flush()  # Flush to get the ID without committing
                genre_id = new_genre.id
            new_game_genre = GameGenre(
                game_id=new_game.id, genre_id=genre_id)
            db.add(new_game_genre)

    if game.screenshots:
        for screenshot in game.screenshots:
            # Check if screenshot exist
            exist_screenshot = db.scalars(select(Screenshot).where(
                Screenshot.screenshot_url == screenshot)).one_or_none()

            if exist_screenshot:
                screenshot_id = exist_screenshot.id
            else:
                # Create new screenshot
                new_screenshot = Screenshot(screenshot_url=screenshot)
                db.add(new_screenshot)
                db.flush()  # Flush to get the ID without committing
                screenshot_id = new_screenshot.id
            new_game_screenshot = GameScreenshot(
                game_id=new_game.id, screenshot_id=screenshot_id)
            db.add(new_game_screenshot)

    if game.videos:
        for video in game.videos:
            # Check if video url exist
            exist_video = db.scalars(select(Video).where(
                Video.video_url == video)).one_or_none()
            if exist_video:
                video_id = exist_video.id
            else:
                # Create new video
                new_video = Video(video_url=video)
                db.add(new_video)
                db.flush()  # Flush to get the ID without committing
                video_id = new_video.id
            new_game_video = GameVideo(
                game_id=new_game.id, video_id=video_id)
            db.add(new_game_video)

    db.commit()

    return new_game


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
