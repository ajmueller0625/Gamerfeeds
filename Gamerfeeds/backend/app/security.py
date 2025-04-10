import base64
from datetime import UTC, datetime, timedelta
from random import SystemRandom
from typing import Annotated
from uuid import UUID, uuid4

from app.api.core.models import Token, User
from app.api.db_setup import get_db
from app.api.settings import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_ENTROPY = 32  # number of bytes to return by default
_sysrand = SystemRandom()


def hash_password(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):

    return pwd_context.verify(plain_password, hashed_password)


def token_bytes(nbytes=None):

    if nbytes is None:
        nbytes = DEFAULT_ENTROPY
    return _sysrand.randbytes(nbytes)


def token_urlsafe(nbytes=None):

    token = token_bytes(nbytes)
    return base64.urlsafe_b64encode(token).rstrip(b"=").decode("ascii")


def create_database_token(user_id: UUID, db: Session):

    randomized_token = token_urlsafe()
    new_token = Token(token=randomized_token, user_id=user_id)
    db.add(new_token)
    db.commit()

    return new_token


def verify_token_access(token_str: str, db: Session) -> Token:

    max_age = timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    token = (
        db.execute(
            select(Token).where(
                Token.token == token_str, Token.created >= datetime.now(
                    UTC) - max_age
            ),
        )
        .scalars()
        .first()
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):

    token = verify_token_access(token_str=token, db=db)
    user = token.user

    return user


def get_current_superuser(current_user: Annotated[User, Depends(get_current_user)]) -> User:

    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Superuser privileges required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return current_user


def get_current_token(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):

    token = verify_token_access(token_str=token, db=db)

    return token
