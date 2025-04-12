from datetime import datetime, timezone
from typing import List
from sqlalchemy import Boolean, String, func, ForeignKey, Text, DateTime, Float
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, backref


class Base(DeclarativeBase):
    pass


class Token(Base):
    __tablename__ = 'tokens'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    created: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc))
    token: Mapped[str] = mapped_column(unique=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'), nullable=False)

    # Relationships
    user: Mapped['User'] = relationship(back_populates='tokens')


class PasswordResetToken(Base):
    __tablename__ = 'password_reset_tokens'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    created: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    token: Mapped[str] = mapped_column(unique=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'), nullable=False)
    user: Mapped['User'] = relationship(back_populates='reset_tokens')
    used: Mapped[bool] = mapped_column(
        default=False
    )


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True)
    firstname: Mapped[str] = mapped_column(String(100), nullable=False)
    lastname: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False)

    # Relationships
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    tokens: Mapped[List['Token']] = relationship(back_populates='user')
    reset_tokens: Mapped[List['PasswordResetToken']
                         ] = relationship(back_populates='user')
    comments: Mapped[List['Comment']] = relationship(back_populates='user')
    discussions: Mapped[List['Discussion']
                        ] = relationship(back_populates='user')


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
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
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

    comments: Mapped[List['Comment']] = relationship(
        secondary='news_comments', back_populates='news')


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
    comments: Mapped[List['Comment']] = relationship(
        secondary='game_comments', back_populates='games')


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
    video_url_id: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)

    # Relationships
    games: Mapped[List['Game']] = relationship(
        secondary='game_videos', back_populates='videos')
    events: Mapped[List['Event']] = relationship(
        secondary='event_videos', back_populates='videos')


class GameVideo(Base):
    __tablename__ = 'game_videos'

    game_id: Mapped[int] = mapped_column(ForeignKey(
        'games.id', ondelete='CASCADE'), primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey(
        'videos.id', ondelete='CASCADE'), primary_key=True)


class Event(Base):
    __tablename__ = 'events'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    logo_url: Mapped[str] = mapped_column(String(255), nullable=False)
    live_stream_url: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relations
    event_urls: Mapped[List['EventURL']] = relationship(back_populates='event')
    videos: Mapped[List['Video']] = relationship(
        secondary='event_videos', back_populates='events')


class EventURL(Base):
    __tablename__ = 'event_urls'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    url: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relations
    event: Mapped['Event'] = relationship(back_populates='event_urls')
    event_id: Mapped[int] = mapped_column(ForeignKey(
        'events.id', ondelete='CASCADE'), primary_key=True)


class EventVideo(Base):
    __tablename__ = 'event_videos'

    event_id: Mapped[int] = mapped_column(ForeignKey(
        'events.id', ondelete='CASCADE'), primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey(
        'videos.id', ondelete='CASCADE'), primary_key=True)


class Comment(Base):
    __tablename__ = 'comments'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # User who created the comment
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    user: Mapped['User'] = relationship(back_populates='comments')

    # Optional parent comment reference (for replies)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    replies: Mapped[List['Comment']] = relationship(
        'Comment',
        backref=backref('parent', remote_side=[id]),
        cascade="all, delete-orphan")

    # Relationships to bridge tables
    games: Mapped[List['Game']] = relationship(
        secondary='game_comments', back_populates='comments')
    news: Mapped[List['News']] = relationship(
        secondary='news_comments', back_populates='comments')
    discussions: Mapped[List['Discussion']] = relationship(
        secondary='discussion_comments', back_populates='comments')


class GameComment(Base):
    __tablename__ = 'game_comments'

    comment_id: Mapped[int] = mapped_column(
        ForeignKey('comments.id', ondelete='CASCADE'), primary_key=True)
    game_id: Mapped[int] = mapped_column(
        ForeignKey('games.id', ondelete='CASCADE'), primary_key=True)


class NewsComment(Base):
    __tablename__ = 'news_comments'

    comment_id: Mapped[int] = mapped_column(
        ForeignKey('comments.id', ondelete='CASCADE'), primary_key=True)
    news_id: Mapped[int] = mapped_column(
        ForeignKey('news.id', ondelete='CASCADE'), primary_key=True)


class Discussion(Base):
    __tablename__ = 'discussions'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # User who created the discussion
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    user: Mapped['User'] = relationship(back_populates='discussions')

    # Relationships to comments
    comments: Mapped[List['Comment']] = relationship(
        secondary='discussion_comments', back_populates='discussions')


class DiscussionComment(Base):
    __tablename__ = 'discussion_comments'

    comment_id: Mapped[int] = mapped_column(
        ForeignKey('comments.id', ondelete='CASCADE'), primary_key=True)
    discussion_id: Mapped[int] = mapped_column(
        ForeignKey('discussions.id', ondelete='CASCADE'), primary_key=True)
