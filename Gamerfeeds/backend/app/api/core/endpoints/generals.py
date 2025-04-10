from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from sqlalchemy import delete, insert, select, update
from sqlalchemy.orm import Session, joinedload, selectinload
from datetime import datetime, timezone

from app.api.core.models import User
from app.api.core.schemas import PasswordChangeSchema, UserOutSchema, UserSchema, UserUpdateSchema
from app.api.db_setup import get_db
from app.security import (
    get_current_superuser,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(tags=["general"], prefix="/general")


@router.get("/user", response_model=list[UserSchema])
def list_users(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_superuser)
) -> list[UserSchema]:
    """
    List all users and their course enrollments
    """
    users = db.scalars(select(User)).all()
    return users


@router.get("/me", response_model=UserOutSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/user/{user_id}", response_model=UserSchema)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> UserSchema:
    """
    Get detailed information about a specific user including their course enrollments
    """
    user = db.scalars(
        select(User)
        .where(User.id == user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    return user


@router.get("/profile", response_model=UserUpdateSchema)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user's profile information
    """
    return current_user


@router.put("/profile", response_model=UserUpdateSchema)
def update_user_profile(
    user_update: UserUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's profile information
    """

    db_user = db.scalars(select(User).where(
        User.id == current_user.id)).first()

    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)

    db.commit()
    return db_user


@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: PasswordChangeSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user's password

    Requires the current password for verification and a new password to set.
    Validates password strength and ensures the new password is different from the current one.
    """
    # Validate input
    if not password_data.current_password or not password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both current and new passwords are required",
        )

    # Check if new password meets complexity requirements
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )

    # Verify current password
    if not verify_password(
        password_data.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Check if new password is the same as current password
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    try:
        # Get fresh user object from database
        db_user = db.scalars(select(User).where(
            User.id == current_user.id)).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Update password
        db_user.hashed_password = hash_password(password_data.new_password)

        db.commit()

        return {
            "message": "Password updated successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update password: {str(e)}",
        )
