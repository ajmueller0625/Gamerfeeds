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
    developers: List[str] | None = []
    platforms: List[str] | None = []
    languages: List[str] | None = []
    genres: List[str] | None = []
    screenshots: List[str] | None = []
    videos: List[str] | None = []
    rating: float | None = None

    model_config = ConfigDict(from_attributes=True)


class GameResponseSchema(BaseModel):
    id: int
    summary: str | None = None
    storyline: str | None = None
    cover_image_url: str = Field(..., min_length=10, max_length=255)
    release_date: datetime
    data_type_id: int
    rating: float | None = None

    model_config = ConfigDict(from_attributes=True)


class EventSchema(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    cover_image_url: str | None = Field(None, max_length=255)
    start_date: datetime
    end_date: datetime | None = None
    website_url: str | None = Field(None, max_length=255)
    location: str | None = Field(None, max_length=255)
    event_type: str | None = Field(None, max_length=100)
    data_type: str
    games: List[int] | None = []
    videos: List[str] | None = []

    model_config = ConfigDict(from_attributes=True)


class EventResponseSchema(BaseModel):
    id: int
    name: str
    description: str | None = None
    cover_image_url: str | None = None
    start_date: datetime
    end_date: datetime | None = None
    website_url: str | None = None
    location: str | None = None
    event_type: str | None = None
    data_type_id: int

    model_config = ConfigDict(from_attributes=True)
