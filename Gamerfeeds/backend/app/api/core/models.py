from datetime import datetime
from typing import List
from sqlalchemy import String, func, ForeignKey, Text, DateTime, Float
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True)
    firstname: Mapped[str] = mapped_column(String(100), nullable=False)
    lastname: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)
    hash_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False)


class Author(Base):
    __tablename__ = 'authors'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    # Relationships
    news: Mapped[List['News']] = relationship(back_populates='author')


class SourceName(Base):
    __tablename__ = 'source_names'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    news: Mapped[List['News']] = relationship(back_populates='source_name')


class News(Base):
    __tablename__ = 'news'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    published: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    author: Mapped['Author'] = relationship(back_populates='news')
    author_id: Mapped[int] = mapped_column(ForeignKey(
        'authors.id', ondelete='CASCADE'), nullable=False)

    source_name: Mapped['SourceName'] = relationship(back_populates='news')
    source_id: Mapped[int] = mapped_column(ForeignKey(
        'source_names.id', ondelete='CASCADE'), nullable=False)


class Game(Base):
    __tablename__ = 'games'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    storyline: Mapped[str] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[str] = mapped_column(
        String(255), nullable=False)
    release_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=True)

    # Relationships
    data_type: Mapped['GameDataType'] = relationship(
        back_populates='games')
    data_type_id: Mapped[int] = mapped_column(
        ForeignKey('game_data_types.id', ondelete='SET NULL'), nullable=True)

    game_platform: Mapped[List['GamePlatform']
                          ] = relationship(back_populates='game')
    game_developer: Mapped[List['GameDeveloper']
                           ] = relationship(back_populates='game')
    game_genre: Mapped[List['GameGenre']] = relationship(
        back_populates='game')
    game_language: Mapped[List['GameLanguage']
                          ] = relationship(back_populates='game')
    game_screenshot: Mapped[List['GameScreenshot']
                            ] = relationship(back_populates='game')
    game_video: Mapped[List['GameVideo']
                       ] = relationship(back_populates='game')


class GameDataType(Base):
    __tablename__ = 'game_data_types'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        String(20), nullable=False, unique=True)

    # Relationships
    games: Mapped[List['Game']] = relationship(back_populates='data_type')


class Platform(Base):
    __tablename__ = 'platforms'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    game_platform: Mapped[List['GamePlatform']
                          ] = relationship(back_populates='platform')


class GamePlatform(Base):
    __tablename__ = 'game_platforms'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    platform_id: Mapped[int] = mapped_column(
        ForeignKey('platforms.id', ondelete='CASCADE'), primary_key=True)

    # Relationships
    game: Mapped['Game'] = relationship(back_populates='game_platform')
    platform: Mapped['Platform'] = relationship(back_populates='game_platform')


class Developer(Base):
    __tablename__ = 'developers'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    game_developer: Mapped[List['GameDeveloper']
                           ] = relationship(back_populates='developer')


class GameDeveloper(Base):
    __tablename__ = 'game_developers'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    developer_id: Mapped[int] = mapped_column(
        ForeignKey('developers.id', ondelete='CASCADE'), primary_key=True)

    # Relationships
    game: Mapped['Game'] = relationship(back_populates='game_developer')
    developer: Mapped['Developer'] = relationship(
        back_populates='game_developer')


class Genre(Base):
    __tablename__ = 'genres'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    game_genre: Mapped[List['GameGenre']
                       ] = relationship(back_populates='genre')


class GameGenre(Base):
    __tablename__ = 'game_genres'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    genre_id: Mapped[int] = mapped_column(
        ForeignKey('genres.id', ondelete='CASCADE'), primary_key=True)

    # Relationships
    game: Mapped['Game'] = relationship(back_populates='game_genre')
    genre: Mapped['Genre'] = relationship(back_populates='game_genre')


class Language(Base):
    __tablename__ = 'languages'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    game_language: Mapped[List['GameLanguage']
                          ] = relationship(back_populates='language')


class GameLanguage(Base):
    __tablename__ = 'game_languages'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id', ondelete='CASCADE'), primary_key=True)

    # Relationships
    game: Mapped['Game'] = relationship(back_populates='game_language')
    language: Mapped['Language'] = relationship(back_populates='game_language')


class Screenshot(Base):
    __tablename__ = 'screenshots'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    screenshot_url: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)

    # Relationships
    game_screenshot: Mapped[List['GameScreenshot']
                            ] = relationship(back_populates='screenshot')


class GameScreenshot(Base):
    __tablename__ = 'game_screenshots'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    screenshot_id: Mapped[int] = mapped_column(
        ForeignKey('screenshots.id', ondelete='CASCADE'), primary_key=True)

    # Relationships
    game: Mapped['Game'] = relationship(back_populates='game_screenshot')
    screenshot: Mapped['Screenshot'] = relationship(
        back_populates='game_screenshot')


class Video(Base):
    __tablename__ = 'videos'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    video_url: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)

    # Relationships
    game_video: Mapped[List['GameVideo']
                       ] = relationship(back_populates='video')


class GameVideo(Base):
    __tablename__ = 'game_videos'

    game_id: Mapped[int] = mapped_column(ForeignKey(
        'games.id', ondelete='CASCADE'), primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey(
        'videos.id', ondelete='CASCADE'), primary_key=True)

    # Relationships
    game: Mapped['Game'] = relationship(back_populates='game_video')
    video: Mapped['Video'] = relationship(back_populates='game_video')
