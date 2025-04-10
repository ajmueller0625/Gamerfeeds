import json
import secrets
from datetime import datetime, timedelta, timezone

import requests
from app.api.core.models import PasswordResetToken, User
from app.api.settings import settings
from sqlalchemy import select
from sqlalchemy.orm import Session


def get_user_by_email(session: Session, email: str) -> User:

    return session.scalars(select(User).where(User.email == email)).first()


def generate_password_reset_token(user_id: int, db: Session) -> str:

    token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(token=token, user_id=user_id)

    db.add(reset_token)
    db.commit()

    return token


def send_password_reset_email(email: str, token: str):
    print(settings.POSTMARK_TOKEN)
    reset_url = f"{settings.FRONTEND_BASE_URL}/reset-password?token={token}"

    message = {
        "From": "aj.mueller@gamerfeeds.se",
        "To": email,
        "Subject": "Password Reset Request",
        "HtmlBody": f'''
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password.</p>
            <p>Please click on the link below to reset your password:</p>
            <p><a href="{reset_url}">Reset Password</a></p>
            <p>This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES // 60} hour(s).</p>
            <p>If you did not request this password reset, please ignore this email.</p>
        ''',
        "MessageStream": "outbound",
    }

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": settings.POSTMARK_TOKEN,
    }

    try:
        response = requests.post(
            "https://api.postmarkapp.com/email",
            headers=headers,
            data=json.dumps(message),
        )
        response.raise_for_status()
        print(f"Email sent to {email}: {response.status_code}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Failed to send email to {email}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.content}")
        return False


def verify_password_reset_token(token: str, db: Session) -> User | None:

    expiry_minutes = settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
    expiry_time = datetime.now(timezone.utc) - \
        timedelta(minutes=expiry_minutes)

    db_token = db.scalars(
        select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.created >= expiry_time,
            PasswordResetToken.used == False,
        )
    ).first()

    if not db_token:
        return None

    return db_token.user


def invalidate_password_reset_token(token: str, db: Session) -> bool:

    db_token = db.scalars(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    ).first()

    if not db_token:
        return False

    db_token.used = True
    db.commit()
    return True
