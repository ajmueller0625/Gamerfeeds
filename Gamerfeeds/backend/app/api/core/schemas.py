from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict, PrivateAttr


class TokenSchema(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: str = None
    exp: int = None


class TokenData(BaseModel):
    id: str | None = None


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str


class PasswordResetRequestSchema(BaseModel):
    email: EmailStr = Field(...,
                            description="Email address for password reset")

    model_config = ConfigDict(
        json_schema_extra={"example": {"email": "user@example.com"}}
    )


class PasswordResetConfirmSchema(BaseModel):
    token: str = Field(...,
                       description="Password reset token received via email")
    new_password: str = Field(
        ..., min_length=8, description="New password that meets security requirements"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "token": "randomsecuretoken",
                "new_password": "NewSecurePassword123",
            }
        }
    )


class UserRegisterSchema(BaseModel):
    username: str = Field(..., max_length=100)
    firstname: str = Field(..., max_length=100)
    lastname: str = Field(..., max_length=100)
    email: EmailStr
    password: str = Field(..., max_length=100, min_length=8, example="yourpassword",
                          description="Password", json_schema_extra={"format": "password"})

    model_config = ConfigDict(from_attributes=True)


class UserSchema(BaseModel):
    id: int
    username: str = Field(..., max_length=100)
    firstname: str = Field(..., max_length=100)
    lastname: str = Field(..., max_length=100)
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class UserOutSchema(UserSchema):
    is_superuser: bool


class UserUpdateSchema(BaseModel):

    username: str | None = None
    firstname: str | None = None
    lastname: str | None = None
    email: EmailStr | None = None

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


class EventURLSchema(BaseModel):

    url: str
    event_id: int

    model_config = ConfigDict(from_attributes=True)


class EventURLResponseSchema(BaseModel):

    id: int
    url: str
    event_id: int

    model_config = ConfigDict(from_attributes=True)


class EventVideoSchema(BaseModel):

    event_id: int
    video_id: int

    model_config = ConfigDict(from_attributes=True)


class EventSchema(BaseModel):

    name: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    start_time: datetime
    end_time: datetime
    logo_url: str = Field(..., min_length=10, max_length=255)
    live_stream_url: str = Field(None, max_length=255)
    urls: List[str] | None = None
    videos: List[str] | None = []
    model_config = ConfigDict(from_attributes=True)


class EventResponseSchema(BaseModel):

    id: int
    name: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    logo_url: str
    live_stream_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EventDetailResponseSchema(EventResponseSchema):

    event_urls: List[str] = Field(
        default=[])
    videos: List[dict] = Field(default=[])

    model_config = ConfigDict(from_attributes=True)


class CommentBaseSchema(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: int | None = Field(None)

    model_config = ConfigDict(from_attributes=True)


class GameCommentCreateSchema(CommentBaseSchema):
    game_id: int = Field(..., gt=0)


class NewsCommentCreateSchema(CommentBaseSchema):
    news_id: int = Field(..., gt=0)


class CommentResponseSchema(BaseModel):
    id: int
    content: str
    created_at: datetime
    updated_at: datetime
    user_id: int
    parent_id: int | None
    user: UserSchema
    replies: List['CommentResponseSchema'] = []

    content_type: str | None = None
    content_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


# Create recursive reference for nested replies
CommentResponseSchema.model_rebuild()


class CommentUpdateSchema(BaseModel):
    content: str = Field(..., min_length=1)

    model_config = ConfigDict(from_attributes=True)


class DiscussionCreateSchema(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10)

    model_config = ConfigDict(from_attributes=True)


class DiscussionResponseSchema(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    user_id: int
    user: UserSchema

    model_config = ConfigDict(from_attributes=True)


class DiscussionDetailResponseSchema(DiscussionResponseSchema):
    comment_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DiscussionUpdateSchema(BaseModel):
    title: str | None = None
    content: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DiscussionCommentCreateSchema(CommentBaseSchema):
    discussion_id: int = Field(..., gt=0)


class ContactFormSchema(BaseModel):
    email: EmailStr
    title: str = Field(..., min_length=3, max_length=100)
    content: str = Field(..., min_length=10, max_length=5000)
