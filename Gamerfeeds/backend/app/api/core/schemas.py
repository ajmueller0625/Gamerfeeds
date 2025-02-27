from datetime import datetime
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
