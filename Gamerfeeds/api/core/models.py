from datetime import datetime
from sqlalchemy import String, func, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)


class Users(Base):
    __tablename__ = 'users'

    username: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True)
    firstname: Mapped[str] = mapped_column(String(100), nullable=False)
    lastname: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    registered_date: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False)


class Authors(Base):
    __tablename__ = 'authors'

    name: Mapped[str] = mapped_column(String(255), nullable=True, unique=True)

    # Relationships
    news: Mapped[list['News']] = relationship(back_populates='author')


class SourceNames(Base):
    __tablename__ = 'source_names'

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    news: Mapped[list['News']] = relationship(back_populates='source_name')


class News(Base):
    __tablename__ = 'news'

    title: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)
    source_url: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    author: Mapped['Authors'] = relationship(back_populates='news')
    author_id: Mapped[int] = mapped_column(ForeignKey(
        'authors.id', ondelete='CASCADE'), nullable=False)

    source_name: Mapped['SourceNames'] = relationship(back_populates='news')
    source_name_id: Mapped[int] = mapped_column(ForeignKey(
        'source_names.id', ondelete='CASCADE'), nullable=False)
