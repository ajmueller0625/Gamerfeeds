from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session
from app.api.db_setup import get_db
from app.api.core.models import Token, User
from app.api.core.schemas import (
    PasswordResetConfirmSchema,
    PasswordResetRequestSchema,
    TokenSchema,
    UserOutSchema,
    UserRegisterSchema,
)
from app.security import (
    create_database_token,
    get_current_token,
    hash_password,
    verify_password,
)
from app.email import (
    generate_password_reset_token,
    get_user_by_email,
    invalidate_password_reset_token,
    send_password_reset_email,
    verify_password_reset_token,
)

router = APIRouter(tags=['authenticate'], prefix='/auth')


@router.post('/user/create', status_code=status.HTTP_201_CREATED)
def register_user(user: UserRegisterSchema, db: Session = Depends(get_db)) -> UserOutSchema:

    hashed_password = hash_password(user.password)
    new_user = User(
        **user.model_dump(exclude={"password"}), hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    return new_user


@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenSchema:

    user = (
        db.execute(
            select(User).where(
                or_(
                    User.email == form_data.username,
                    User.username == form_data.username
                )
            ),
        )
        .scalars()
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Passwords do not match",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_database_token(user_id=user.id, db=db)
    return {"access_token": access_token.token, "token_type": "bearer"}


@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    current_token: Token = Depends(get_current_token),
    db: Session = Depends(get_db),
):
    db.execute(delete(Token).where(Token.token == current_token.token))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
def request_password_reset(
    reset_request: PasswordResetRequestSchema,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):

    user = get_user_by_email(session=db, email=reset_request.email)
    if not user:
        return {
            "message": "If the email exists in our system, a password reset link has been sent"
        }

    token = generate_password_reset_token(user_id=user.id, db=db)
    background_tasks.add_task(
        send_password_reset_email, reset_request.email, token)

    return {
        "message": "If the email exists in our system, a password reset link has been sent"
    }


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
def confirm_password_reset(
    reset_confirm: PasswordResetConfirmSchema, db: Session = Depends(get_db)
):

    user = verify_password_reset_token(token=reset_confirm.token, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
        )

    if len(reset_confirm.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )
    user.hashed_password = hash_password(reset_confirm.new_password)
    invalidate_password_reset_token(reset_confirm.token, db)
    db.commit()

    return {"message": "Password has been reset successfully"}


@router.get("/check-email", status_code=status.HTTP_200_OK)
def check_email_exists(email: str, db: Session = Depends(get_db)):
    """
    Check if an email already exists in the database
    """
    user = db.execute(select(User).where(
        User.email == email)).scalars().first()
    return {"exists": user is not None}


@router.get("/check-username", status_code=status.HTTP_200_OK)
def check_username_exists(username: str, db: Session = Depends(get_db)):
    """
    Check if a username already exists in the database
    """
    user = db.execute(select(User).where(
        User.username == username)).scalars().first()
    return {"exists": user is not None}
