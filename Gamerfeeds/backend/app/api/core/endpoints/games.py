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

router = APIRouter(tags='game')


@router.get('/games', status_code=status.HTTP_200_OK)
def get_all_games(db: Session = Depends(get_db)):
    all_games = db.scalars(select(Game)).all()
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
                                               'platforms', 'languages', 'genres', 'screenshots', 'videos'}, data_type_id=data_type_id))
    db.add(new_game)

    if game.developers:
        for developer in game.developers:
            developer_id = None
            try:
                developer_id = add_developer(developer=developer).id
            except HTTPException:
                developer_id = db.scalars(select(Developer.id).where(
                    Developer.name == developer)).first()
            new_game_developer = GameDeveloper(
                game_id=new_game.id, developer_id=developer_id)
            db.add(new_game_developer)

    if game.platforms:
        for platform in game.platforms:
            platform_id = None
            try:
                platform_id = add_platform(platform=platform).id
            except HTTPException:
                platform_id = db.scalars(select(Platform.id).where(
                    Platform.name == platform)).first()
            new_game_platform = GamePlatform(
                game_id=new_game.id, platform_id=platform_id)
            db.add(new_game_developer)

    if game.languages:
        for language in game.languages:
            language_id = None
            try:
                language_id = add_language(language=language).id
            except HTTPException:
                language_id = db.scalars(select(Language.id).where(
                    Language.name == language)).first()
            new_game_language = GameLanguage(
                game_id=new_game.id, language_id=language_id)
            db.add(new_game_language)

    if game.genres:
        for genre in game.genres:
            genre_id = None
            try:
                genre_id = add_genre(genre=genre).id
            except HTTPException:
                genre_id = db.scalars(select(Genre.id).where(
                    Genre.name == genre)).first()
            new_game_genre = GameGenre(
                game_id=new_game.id, genre_id=genre_id)
            db.add(new_game_genre)

    if game.screenshots:
        for screenshot in game.screenshots:
            screenshot_id = None
            try:
                screenshot_id = add_screenshot(screenshot=screenshot).id
            except HTTPException:
                screenshot_id = db.scalars(select(Screenshot.id).where(
                    Screenshot.screenshot_url == screenshot)).first()
            new_game_screenshot = GameScreenshot(
                game_id=new_game.id, screenshot_id=screenshot_id)
            db.add(new_game_screenshot)

    if game.videos:
        for video in game.videos:
            video_id = None
            try:
                video_id = add_video(video=video).id
            except HTTPException:
                video_id = db.scalars(select(Video.id).where(
                    Video.video_url == video)).first()
            new_game_video = GameVideo(
                game_id=new_game.id, video_id=video_id)
            db.add(new_game_video)

    db.commit()

    return new_game


@router.post('/games/developers', status_code=status.HTTP_201_CREATED, response_model=DeveloperResponseSchema)
def add_developer(developer: DeveloperSchema, db: Session = Depends(get_db)):
    exist_developer = db.scalars(select(Developer).where(
        Developer.name == developer)).one_or_none()

    if exist_developer:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Developer already exist')
    new_developer = Developer(name=developer)
    db.add(new_developer)
    db.commit()

    return new_developer


@router.post('/games/platforms', status_code=status.HTTP_201_CREATED, response_model=PlatformResponseSchema)
def add_platform(platform: PlatformSchema, db: Session = Depends(get_db)):
    exist_platform = db.scalars(select(Platform).where(
        Platform.name == platform)).one_or_none()

    if exist_platform:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Platform already exist')
    new_platform = Developer(name=platform)
    db.add(new_platform)
    db.commit()

    return new_platform


@router.post('/games/languages', status_code=status.HTTP_201_CREATED, response_model=LanguageResponseSchema)
def add_language(language: LanguageSchema, db: Session = Depends(get_db)):
    exist_language = db.scalars(select(Language).where(
        Language.name == language)).one_or_none()

    if exist_language:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Language already exist')
    new_language = Language(name=language)
    db.add(new_language)
    db.commit()

    return new_language


@router.post('/games/genres', status_code=status.HTTP_201_CREATED, response_model=GenreResponseSchema)
def add_genre(genre: GenreSchema, db: Session = Depends(get_db)):
    exist_genre = db.scalars(select(Genre).where(
        Genre.name == genre)).one_or_none()

    if exist_genre:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Genre already exist')
    new_genre = Genre(name=genre)
    db.add(new_genre)
    db.commit()

    return new_genre


@router.post('/games/screenshots', status_code=status.HTTP_201_CREATED, response_model=ScreenshotResponseSchema)
def add_screenshot(screenshot: ScreenshotSchema, db: Session = Depends(get_db)):
    exist_screenshot = db.scalars(select(Screenshot).where(
        Screenshot.screenshot_url == screenshot)).one_or_none()

    if exist_screenshot:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Screenshot already exist')
    new_screenshot = Screenshot(screenshot_url=screenshot)
    db.add(new_screenshot)
    db.commit()

    return new_screenshot


@router.post('/games/videos', status_code=status.HTTP_201_CREATED, response_model=VideoResponseSchema)
def add_video(video: VideoSchema, db: Session = Depends(get_db)):
    exist_video = db.scalars(select(Video).where(
        Video.video_url == video)).one_or_none()

    if exist_video:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Video already exist')
    new_video = Screenshot(video_url=video)
    db.add(new_video)
    db.commit()

    return new_video
