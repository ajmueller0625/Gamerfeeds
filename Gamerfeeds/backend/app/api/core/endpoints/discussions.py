from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select, delete, func, desc
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List, Optional

from app.api.db_setup import get_db
from app.api.core.models import Discussion, User, Comment, DiscussionComment
from app.api.core.schemas import (
    DiscussionCreateSchema,
    DiscussionResponseSchema,
    DiscussionDetailResponseSchema,
    DiscussionUpdateSchema,
    CommentResponseSchema,
    DiscussionCommentCreateSchema
)
from app.security import get_current_user

router = APIRouter(tags=["discussions"], prefix="/discussions")


@router.post("", status_code=status.HTTP_201_CREATED, response_model=DiscussionResponseSchema)
def create_discussion(
    discussion_data: DiscussionCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new discussion post"""
    new_discussion = Discussion(
        title=discussion_data.title,
        content=discussion_data.content,
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.add(new_discussion)
    db.commit()
    db.refresh(new_discussion)

    # Reload with user information
    discussion_with_user = db.scalar(
        select(Discussion)
        .options(joinedload(Discussion.user))
        .where(Discussion.id == new_discussion.id)
    )

    return discussion_with_user


@router.get("", response_model=List[DiscussionDetailResponseSchema])
def get_discussions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get a paginated list of discussions"""

    # Get discussions with user info
    stmt = (
        select(Discussion)
        .options(joinedload(Discussion.user))
        .order_by(desc(Discussion.created_at))
        .offset(skip)
        .limit(limit)
    )

    discussions = db.execute(stmt).unique().scalars().all()

    # Add comment counts
    results = []
    for discussion in discussions:
        comment_count = db.scalar(
            select(func.count())
            .select_from(DiscussionComment)
            .where(DiscussionComment.discussion_id == discussion.id)
        ) or 0

        result = DiscussionDetailResponseSchema.model_validate(discussion)
        result.comment_count = comment_count
        results.append(result)

    return results


@router.get("/count", response_model=dict)
def get_discussions_count(db: Session = Depends(get_db)):
    """Get the total number of discussions"""
    total = db.scalar(select(func.count()).select_from(Discussion))
    return {"total": total or 0}


@router.get("/{discussion_id}", response_model=DiscussionDetailResponseSchema)
def get_discussion(
    discussion_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get a specific discussion by ID"""
    discussion = db.scalar(
        select(Discussion)
        .options(joinedload(Discussion.user))
        .where(Discussion.id == discussion_id)
    )

    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {discussion_id} not found"
        )

    # Get comment count
    comment_count = db.scalar(
        select(func.count())
        .select_from(DiscussionComment)
        .where(DiscussionComment.discussion_id == discussion_id)
    ) or 0

    result = DiscussionDetailResponseSchema.model_validate(discussion)
    result.comment_count = comment_count

    return result


@router.put("/{discussion_id}", response_model=DiscussionResponseSchema)
def update_discussion(
    discussion_data: DiscussionUpdateSchema,
    discussion_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a discussion (only the original author can update)"""
    discussion = db.scalar(select(Discussion).where(
        Discussion.id == discussion_id))

    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {discussion_id} not found"
        )

    # Verify the current user is the author
    if discussion.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own discussions"
        )

    # Update only the provided fields
    if discussion_data.title is not None:
        discussion.title = discussion_data.title
    if discussion_data.content is not None:
        discussion.content = discussion_data.content

    discussion.updated_at = datetime.now(timezone.utc)

    db.add(discussion)
    db.commit()
    db.refresh(discussion)

    # Reload with user information
    discussion_with_user = db.scalar(
        select(Discussion)
        .options(joinedload(Discussion.user))
        .where(Discussion.id == discussion.id)
    )

    return discussion_with_user


@router.delete("/{discussion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discussion(
    discussion_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a discussion (only the original author or superuser can delete)"""
    discussion = db.scalar(select(Discussion).where(
        Discussion.id == discussion_id))

    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {discussion_id} not found"
        )

    # Verify the current user is the author or a superuser
    if discussion.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own discussions"
        )

    # Delete the discussion (cascade will handle comments)
    db.execute(delete(Discussion).where(Discussion.id == discussion_id))
    db.commit()

    return None


@router.post("/comments", status_code=status.HTTP_201_CREATED, response_model=CommentResponseSchema)
def create_discussion_comment(
    comment_data: DiscussionCommentCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comment or reply to an existing one for a discussion"""

    # Validate the discussion exists
    discussion = db.scalar(select(Discussion).where(
        Discussion.id == comment_data.discussion_id))
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {comment_data.discussion_id} not found"
        )

    # If it's a reply, validate the parent comment
    if comment_data.parent_id:
        parent_comment = db.scalar(
            select(Comment)
            .join(DiscussionComment, Comment.id == DiscussionComment.comment_id)
            .where(
                Comment.id == comment_data.parent_id,
                DiscussionComment.discussion_id == comment_data.discussion_id
            )
        )

        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent comment with ID {comment_data.parent_id} not found for this discussion"
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

    # Create the discussion-comment association
    discussion_comment = DiscussionComment(
        comment_id=new_comment.id,
        discussion_id=comment_data.discussion_id
    )

    db.add(discussion_comment)
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
    result.content_type = "discussion"
    result.content_id = comment_data.discussion_id

    return result


@router.get("/{discussion_id}/comments", response_model=List[CommentResponseSchema])
def get_discussion_comments(
    discussion_id: int = Path(..., gt=0),
    parent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all comments for a specific discussion"""

    # Check if discussion exists
    discussion = db.scalar(select(Discussion).where(
        Discussion.id == discussion_id))
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion with ID {discussion_id} not found"
        )

    # Get comments
    stmt = (
        select(Comment)
        .join(DiscussionComment, Comment.id == DiscussionComment.comment_id)
        .where(DiscussionComment.discussion_id == discussion_id)
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
        result.content_type = "discussion"
        result.content_id = discussion_id

        # Also add to all replies
        for reply in result.replies:
            reply.content_type = "discussion"
            reply.content_id = discussion_id

        results.append(result)

    return results
