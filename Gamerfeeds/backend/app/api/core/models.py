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
        String(255), nullable=False)
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
        ForeignKey('game_data_types.id', ondelete='SET NULL'), nullable=False)

    platforms: Mapped[List['Platform']] = relationship(
        secondary='game_platforms', back_populates='games')
    developers: Mapped[List['Developer']] = relationship(
        secondary='game_developers', back_populates='games')
    genres: Mapped[List['Genre']] = relationship(
        secondary='game_genres', back_populates='games')
    languages: Mapped[List['Language']] = relationship(
        secondary='game_languages', back_populates='games')
    screenshots: Mapped[List['Screenshot']] = relationship(
        secondary='game_screenshots', back_populates='games')
    videos: Mapped[List['Video']] = relationship(
        secondary='game_videos', back_populates='games')


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
    games: Mapped[List['Game']] = relationship(
        secondary='game_platforms', back_populates='platforms')


class GamePlatform(Base):
    __tablename__ = 'game_platforms'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    platform_id: Mapped[int] = mapped_column(
        ForeignKey('platforms.id', ondelete='CASCADE'), primary_key=True)


class Developer(Base):
    __tablename__ = 'developers'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    games: Mapped[List['Game']] = relationship(
        secondary='game_developers', back_populates='developers')


class GameDeveloper(Base):
    __tablename__ = 'game_developers'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    developer_id: Mapped[int] = mapped_column(
        ForeignKey('developers.id', ondelete='CASCADE'), primary_key=True)


class Genre(Base):
    __tablename__ = 'genres'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    games: Mapped[List['Game']] = relationship(
        secondary='game_genres', back_populates='genres')


class GameGenre(Base):
    __tablename__ = 'game_genres'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    genre_id: Mapped[int] = mapped_column(
        ForeignKey('genres.id', ondelete='CASCADE'), primary_key=True)


class Language(Base):
    __tablename__ = 'languages'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    games: Mapped[List['Game']] = relationship(
        secondary='game_languages', back_populates='languages')


class GameLanguage(Base):
    __tablename__ = 'game_languages'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id', ondelete='CASCADE'), primary_key=True)


class Screenshot(Base):
    __tablename__ = 'screenshots'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    screenshot_url: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)

    # Relationships
    games: Mapped[List['Game']] = relationship(
        secondary='game_screenshots', back_populates='screenshots')


class GameScreenshot(Base):
    __tablename__ = 'game_screenshots'

    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)
    screenshot_id: Mapped[int] = mapped_column(
        ForeignKey('screenshots.id', ondelete='CASCADE'), primary_key=True)


class Video(Base):
    __tablename__ = 'videos'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    video_url: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)

    # Relationships
    games: Mapped[List['Game']] = relationship(
        secondary='game_videos', back_populates='videos')


class GameVideo(Base):
    __tablename__ = 'game_videos'

    game_id: Mapped[int] = mapped_column(ForeignKey(
        'games.id', ondelete='CASCADE'), primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey(
        'videos.id', ondelete='CASCADE'), primary_key=True)
