from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy import select, delete, and_, or_, func
from sqlalchemy.orm import Session, joinedload, aliased, contains_eager
from datetime import datetime, timezone
from typing import List, Optional, Literal

from app.api.db_setup import get_db
from app.api.core.models import Comment, User, Game, News, GameComment, NewsComment
from app.api.core.schemas import (
    GameCommentCreateSchema,
    NewsCommentCreateSchema,
    CommentResponseSchema,
    CommentUpdateSchema
)
from app.security import get_current_user

router = APIRouter(tags=["comments"], prefix="/comments")


@router.post("/game", status_code=status.HTTP_201_CREATED, response_model=CommentResponseSchema)
def create_game_comment(
    comment_data: GameCommentCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comment or reply to an existing one for a game"""

    # Validate the game exists
    game = db.scalar(select(Game).where(Game.id == comment_data.game_id))
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game with ID {comment_data.game_id} not found"
        )

    # If it's a reply, validate the parent comment
    if comment_data.parent_id:
        parent_comment = db.scalar(
            select(Comment)
            .join(GameComment, Comment.id == GameComment.comment_id)
            .where(
                Comment.id == comment_data.parent_id,
                GameComment.game_id == comment_data.game_id
            )
        )

        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent comment with ID {comment_data.parent_id} not found for this game"
            )

        # Check if user is trying to reply to their own comment
        if parent_comment.user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot reply to your own comment"
            )

    # Create the comment
    new_comment = Comment(
        content=comment_data.content,
        user_id=current_user.id,
        parent_id=comment_data.parent_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.add(new_comment)
    db.flush()  # Get the ID without committing

    # Create the game-comment association
    game_comment = GameComment(
        comment_id=new_comment.id,
        game_id=comment_data.game_id
    )

    db.add(game_comment)
    db.commit()
    db.refresh(new_comment)

    # Reload with user information
    comment_with_user = db.scalar(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.id == new_comment.id)
    )

    # Add virtual content type and ID for the frontend
    result = CommentResponseSchema.model_validate(comment_with_user)
    result.content_type = "game"
    result.content_id = comment_data.game_id

    return result


@router.post("/news", status_code=status.HTTP_201_CREATED, response_model=CommentResponseSchema)
def create_news_comment(
    comment_data: NewsCommentCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comment or reply to an existing one for a news article"""

    # Validate the news exists
    news = db.scalar(select(News).where(News.id == comment_data.news_id))
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"News with ID {comment_data.news_id} not found"
        )

    # If it's a reply, validate the parent comment
    if comment_data.parent_id:
        parent_comment = db.scalar(
            select(Comment)
            .join(NewsComment, Comment.id == NewsComment.comment_id)
            .where(
                Comment.id == comment_data.parent_id,
                NewsComment.news_id == comment_data.news_id
            )
        )

        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent comment with ID {comment_data.parent_id} not found for this news article"
            )

        # Check if user is trying to reply to their own comment
        if parent_comment.user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot reply to your own comment"
            )

    # Create the comment
    new_comment = Comment(
        content=comment_data.content,
        user_id=current_user.id,
        parent_id=comment_data.parent_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.add(new_comment)
    db.flush()  # Get the ID without committing

    # Create the news-comment association
    news_comment = NewsComment(
        comment_id=new_comment.id,
        news_id=comment_data.news_id
    )

    db.add(news_comment)
    db.commit()
    db.refresh(new_comment)

    # Reload with user information
    comment_with_user = db.scalar(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.id == new_comment.id)
    )

    # Add virtual content type and ID for the frontend
    result = CommentResponseSchema.model_validate(comment_with_user)
    result.content_type = "news"
    result.content_id = comment_data.news_id

    return result


@router.get("/game/{game_id}", response_model=List[CommentResponseSchema])
def get_game_comments(
    game_id: int = Path(..., gt=0),
    parent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all comments for a specific game"""

    # Check if game exists
    game = db.scalar(select(Game).where(Game.id == game_id))
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game with ID {game_id} not found"
        )

    # Get comments - Fixed query to avoid duplicate rows
    stmt = (
        select(Comment)
        .join(GameComment, Comment.id == GameComment.comment_id)
        .where(GameComment.game_id == game_id)
        .where(Comment.parent_id == parent_id)
        .options(joinedload(Comment.user))
        .order_by(Comment.created_at.desc())
    )

    comments = db.execute(stmt).unique().scalars().all()

    # Get replies separately to avoid the unique() issue
    for comment in comments:
        reply_stmt = (
            select(Comment)
            .where(Comment.parent_id == comment.id)
            .options(joinedload(Comment.user))
            .order_by(Comment.created_at.desc())
        )
        comment.replies = db.execute(reply_stmt).scalars().all()

    # Add virtual content type and ID for the frontend
    results = []
    for comment in comments:
        result = CommentResponseSchema.model_validate(comment)
        result.content_type = "game"
        result.content_id = game_id

        # Also add to all replies
        for reply in result.replies:
            reply.content_type = "game"
            reply.content_id = game_id

        results.append(result)

    return results


@router.get("/news/{news_id}", response_model=List[CommentResponseSchema])
def get_news_comments(
    news_id: int = Path(..., gt=0),
    parent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all comments for a specific news article"""

    # Check if news exists
    news = db.scalar(select(News).where(News.id == news_id))
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"News with ID {news_id} not found"
        )

    # Get comments - Fixed query to avoid duplicate rows
    stmt = (
        select(Comment)
        .join(NewsComment, Comment.id == NewsComment.comment_id)
        .where(NewsComment.news_id == news_id)
        .where(Comment.parent_id == parent_id)
        .options(joinedload(Comment.user))
        .order_by(Comment.created_at.desc())
    )

    comments = db.execute(stmt).unique().scalars().all()

    # Get replies separately to avoid the unique() issue
    for comment in comments:
        reply_stmt = (
            select(Comment)
            .where(Comment.parent_id == comment.id)
            .options(joinedload(Comment.user))
            .order_by(Comment.created_at.desc())
        )
        comment.replies = db.execute(reply_stmt).scalars().all()

    # Add virtual content type and ID for the frontend
    results = []
    for comment in comments:
        result = CommentResponseSchema.model_validate(comment)
        result.content_type = "news"
        result.content_id = news_id

        # Also add to all replies
        for reply in result.replies:
            reply.content_type = "news"
            reply.content_id = news_id

        results.append(result)

    return results


@router.get("/{comment_id}", response_model=CommentResponseSchema)
def get_comment_by_id(
    comment_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get a specific comment by ID"""

    # Modified to avoid the unique() issue
    comment = db.scalar(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.id == comment_id)
    )

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} not found"
        )

    # Get replies separately
    reply_stmt = (
        select(Comment)
        .where(Comment.parent_id == comment_id)
        .options(joinedload(Comment.user))
        .order_by(Comment.created_at.desc())
    )
    comment.replies = db.execute(reply_stmt).scalars().all()

    # Determine content type and ID
    game_comment = db.scalar(
        select(GameComment).where(GameComment.comment_id == comment_id)
    )

    result = CommentResponseSchema.model_validate(comment)

    if game_comment:
        result.content_type = "game"
        result.content_id = game_comment.game_id

        # Also add to all replies
        for reply in result.replies:
            reply.content_type = "game"
            reply.content_id = game_comment.game_id
    else:
        news_comment = db.scalar(
            select(NewsComment).where(NewsComment.comment_id == comment_id)
        )

        if news_comment:
            result.content_type = "news"
            result.content_id = news_comment.news_id

            # Also add to all replies
            for reply in result.replies:
                reply.content_type = "news"
                reply.content_id = news_comment.news_id

    return result


@router.put("/{comment_id}", response_model=CommentResponseSchema)
def update_comment(
    comment_data: CommentUpdateSchema,
    comment_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment (only the original author can update)"""

    comment = db.scalar(select(Comment).where(Comment.id == comment_id))

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} not found"
        )

    # Verify the current user is the author
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own comments"
        )

    # Update the comment
    comment.content = comment_data.content
    comment.updated_at = datetime.now(timezone.utc)

    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Modified to avoid the unique() issue - get user info
    comment_with_user = db.scalar(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.id == comment.id)
    )

    # Get replies separately
    reply_stmt = (
        select(Comment)
        .where(Comment.parent_id == comment_id)
        .options(joinedload(Comment.user))
        .order_by(Comment.created_at.desc())
    )
    comment_with_user.replies = db.execute(reply_stmt).scalars().all()

    # Determine content type and ID
    game_comment = db.scalar(
        select(GameComment).where(GameComment.comment_id == comment_id)
    )

    result = CommentResponseSchema.model_validate(comment_with_user)

    if game_comment:
        result.content_type = "game"
        result.content_id = game_comment.game_id

        # Also add to all replies
        for reply in result.replies:
            reply.content_type = "game"
            reply.content_id = game_comment.game_id
    else:
        news_comment = db.scalar(
            select(NewsComment).where(NewsComment.comment_id == comment_id)
        )

        if news_comment:
            result.content_type = "news"
            result.content_id = news_comment.news_id

            # Also add to all replies
            for reply in result.replies:
                reply.content_type = "news"
                reply.content_id = news_comment.news_id

    return result


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (only the original author or superuser can delete)"""

    comment = db.scalar(select(Comment).where(Comment.id == comment_id))

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} not found"
        )

    # Verify the current user is the author or a superuser
    if comment.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments"
        )

    # Delete the comment (cascade will handle bridge tables and replies)
    db.execute(delete(Comment).where(Comment.id == comment_id))
    db.commit()

    return None


@router.get("/user/{user_id}", response_model=List[CommentResponseSchema])
def get_user_comments(
    user_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get all comments by a specific user"""

    # Check if user exists
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Get all top-level comments (not replies) - Modified to avoid the unique() issue
    stmt = (
        select(Comment)
        .where(Comment.user_id == user_id)
        .where(Comment.parent_id == None)
        .options(joinedload(Comment.user))
        .order_by(Comment.created_at.desc())
    )

    comments = db.execute(stmt).unique().scalars().all()

    # Get replies separately
    for comment in comments:
        reply_stmt = (
            select(Comment)
            .where(Comment.parent_id == comment.id)
            .options(joinedload(Comment.user))
            .order_by(Comment.created_at.desc())
        )
        comment.replies = db.execute(reply_stmt).scalars().all()

    # Add virtual content type and ID for each comment
    results = []
    for comment in comments:
        # Check if it's a game comment
        game_comment = db.scalar(
            select(GameComment).where(GameComment.comment_id == comment.id)
        )

        result = CommentResponseSchema.model_validate(comment)

        if game_comment:
            result.content_type = "game"
            result.content_id = game_comment.game_id

            # Also add to all replies
            for reply in result.replies:
                reply.content_type = "game"
                reply.content_id = game_comment.game_id
        else:
            # Must be a news comment
            news_comment = db.scalar(
                select(NewsComment).where(NewsComment.comment_id == comment.id)
            )

            if news_comment:
                result.content_type = "news"
                result.content_id = news_comment.news_id

                # Also add to all replies
                for reply in result.replies:
                    reply.content_type = "news"
                    reply.content_id = news_comment.news_id

        results.append(result)

    return results
