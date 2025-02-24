from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from api.core.models import Base
from api.settings import settings

engine = create_engine(f'{settings.DB_URL}', echo=True)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    with Session(engine, expire_on_commit=False,) as session:
        yield session
