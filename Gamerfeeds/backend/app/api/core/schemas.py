from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class UserSchema(BaseModel):
    username: str = Field(..., max_length=100)
    firstname: str = Field(..., max_length=100)
    lastname: str = Field(..., max_length=100)
    email: EmailStr
    password: str = Field(..., max_length=255)

    model_config = ConfigDict(from_attributes=True)


class NewsSchema(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str | None = None
    image_url: str = Field(..., max_length=255)
    author: str = Field(..., min_length=5, max_length=255)
    source_name: str = Field(..., min_length=3, max_length=255)
    source_url: str = Field(..., max_length=255)
    content: str
    published: datetime

    model_config = ConfigDict(from_attributes=True)


class NewsResponseSchema(BaseModel):
    id: int
    title: str
    description: str | None = None
    image_url: str
    source_url: str
    content: str
    published: datetime
    author_id: int
    source_name_id: int

    model_config = ConfigDict(from_attributes=True)


class AuthorSchema(BaseModel):
    name: str = Field(..., min_length=10, max_length=255)

    model_config = ConfigDict(from_attributes=True)


class AuthorResponseSchema(AuthorSchema):
    id: int


class SourceNameSchema(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class SourceNameResponseSchema(SourceNameSchema):
    id: int


class DeveloperSchema(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class DeveloperResponseSchema(DeveloperSchema):
    id: int


class PlatformSchema(BaseModel):
    name: str = Field(..., min_length=5, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class PlatformResponseSchema(PlatformSchema):
    id: int


class LanguageSchema(BaseModel):
    name: str = Field(..., min_length=5, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class LanguageResponseSchema(LanguageSchema):
    id: int


class GenreSchema(BaseModel):
    name: str = Field(..., min_length=5, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class GenreResponseSchema(GenreSchema):
    id: int


class ScreenshotSchema(BaseModel):
    screenshot_url: str = Field(..., min_length=10, max_length=255)

    model_config = ConfigDict(from_attributes=True)


class ScreenshotResponseSchema(ScreenshotSchema):
    id: int


class VideoSchema(BaseModel):
    video_url: str = Field(..., min_length=10, max_length=255)

    model_config = ConfigDict(from_attributes=True)


class VideoResponseSchema(VideoSchema):
    id: int


class GameSchema(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    summary: str | None = None
    storyline: str | None = None
    cover_image_url: str = Field(..., min_length=10, max_length=255)
    release_date: datetime
    data_type: str
    developers: List[DeveloperSchema] | None = []
    platforms: List[PlatformSchema] | None = []
    languages: List[LanguageSchema] | None = []
    genres: List[GenreSchema] | None = []
    screenshots: List[ScreenshotSchema] | None = []
    videos: List[VideoSchema] | None = []
    rating: int | None = None

    model_config = ConfigDict(from_attributes=True)


class GamePlatformSchema(BaseModel):
    game_id: int
    platform_id: int

    model_config = ConfigDict(from_attributes=True)


class GamePlatformResponseSchema(BaseModel):
    game_id: int
    game_name: str = Field(..., min_length=3, max_length=255)
    platforms: List[PlatformSchema] | None = []

    model_config = ConfigDict(from_attributes=True)


class GameDeveloperSchema(BaseModel):
    game_id: int
    developer_id: int

    model_config = ConfigDict(from_attributes=True)


class GameDeveloperResponseSchema(BaseModel):
    game_id: int
    game_name: str = Field(..., min_length=3, max_length=255)
    developers: List[DeveloperSchema] | None = []

    model_config = ConfigDict(from_attributes=True)


class GameGenreSchema(BaseModel):
    game_id: int
    genre_id: int

    model_config = ConfigDict(from_attributes=True)


class GameGenreResponseSchema(BaseModel):
    game_id: int
    game_name: str = Field(..., min_length=3, max_length=255)
    genres: List[GenreSchema] | None = []

    model_config = ConfigDict(from_attributes=True)


class GameLanguageSchema(BaseModel):
    game_id: int
    language_id: int

    model_config = ConfigDict(from_attributes=True)


class GameLanguageResponseSchema(BaseModel):
    game_id: int
    game_name: str = Field(..., min_length=3, max_length=255)
    languages: List[LanguageSchema] | None = []

    model_config = ConfigDict(from_attributes=True)


class GameScreenshotSchema(BaseModel):
    game_id: int
    screenshot_id: int

    model_config = ConfigDict(from_attributes=True)


class GameScreenshotResponseSchema(BaseModel):
    game_id: int
    game_name: str = Field(..., min_length=3, max_length=255)
    screenshots: List[ScreenshotSchema] | None = []

    model_config = ConfigDict(from_attributes=True)


class GameVideoSchema(BaseModel):
    game_id: int
    screenshot_id: int

    model_config = ConfigDict(from_attributes=True)


class GameVideoResponseSchema(BaseModel):
    game_id: int
    game_name: str = Field(..., min_length=3, max_length=255)
    videos: List[VideoSchema] | None = []

    model_config = ConfigDict(from_attributes=True)
