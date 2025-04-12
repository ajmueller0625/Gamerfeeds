import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CommentItem from "./CommentItem";
import useAuthStore from "../store/authStore";
import useCommentStore from "../store/commentStore";
import { MessageSquare, Send, X, AlertTriangle, LogIn } from "lucide-react";

interface CommentsSectionProps {
  contentType: "game" | "news" | "discussion";
  contentId: number;
}

export default function CommentsSection({
  contentType,
  contentId,
}: CommentsSectionProps) {
  // Updated to use token instead of isAuthenticated
  const { token } = useAuthStore();
  const {
    comments,
    isLoading,
    error,
    fetchGameComments,
    fetchNewsComments,
    fetchDiscussionComments,
    addGameComment,
    addNewsComment,
    addDiscussionComment,
    updateComment,
    deleteComment,
  } = useCommentStore();

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loadingAttempt, setLoadingAttempt] = useState(0);

  const navigate = useNavigate();

  // Compute isAuthenticated from token
  const isAuthenticated = !!token;

  useEffect(() => {
    console.log(
      `CommentsSection mounted for ${contentType} with ID: ${contentId}`
    );

    // Skip if contentId is invalid
    if (!contentId || contentId <= 0) {
      console.error(`Invalid ${contentType} ID: ${contentId}`);
      return;
    }

    const loadComments = async () => {
      try {
        if (contentType === "game") {
          await fetchGameComments(contentId);
        } else if (contentType === "news") {
          await fetchNewsComments(contentId);
        } else if (contentType === "discussion") {
          await fetchDiscussionComments(contentId);
        }
      } catch (err) {
        console.error(`Error loading ${contentType} comments:`, err);
      }
    };

    loadComments();
  }, [
    contentType,
    contentId,
    fetchGameComments,
    fetchNewsComments,
    fetchDiscussionComments,
    loadingAttempt,
  ]);

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (newComment.trim()) {
      try {
        if (contentType === "game") {
          addGameComment({
            content: newComment,
            game_id: contentId,
            parent_id: null,
          });
        } else if (contentType === "news") {
          addNewsComment({
            content: newComment,
            news_id: contentId,
            parent_id: null,
          });
        } else if (contentType === "discussion") {
          addDiscussionComment({
            content: newComment,
            discussion_id: contentId,
            parent_id: null,
          });
        }
        setNewComment("");
      } catch (err) {
        console.error("Error submitting comment:", err);
      }
    }
  };

  const handleSubmitReply = (parentId: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (replyContent.trim()) {
      try {
        if (contentType === "game") {
          addGameComment({
            content: replyContent,
            game_id: contentId,
            parent_id: parentId,
          });
        } else if (contentType === "news") {
          addNewsComment({
            content: replyContent,
            news_id: contentId,
            parent_id: parentId,
          });
        } else if (contentType === "discussion") {
          addDiscussionComment({
            content: replyContent,
            discussion_id: contentId,
            parent_id: parentId,
          });
        }
        setReplyContent("");
        setReplyingTo(null);
      } catch (err) {
        console.error("Error submitting reply:", err);
      }
    }
  };

  const handleStartReply = (parentId: number) => {
    setReplyingTo(parentId);
    setReplyContent("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleEditComment = (commentId: number, content: string) => {
    try {
      updateComment(commentId, { content });
    } catch (err) {
      console.error("Error updating comment:", err);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        deleteComment(commentId);
      } catch (err) {
        console.error("Error deleting comment:", err);
      }
    }
  };

  const handleRetry = () => {
    // Trigger a re-fetch by incrementing the loading attempt counter
    setLoadingAttempt((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 spinner-color"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 submit-button text-white rounded-md text-sm mt-2 hover:cursor-pointer"
        >
          Retry Loading Comments
        </button>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <div className="comments-header flex items-center mb-4">
        <MessageSquare className="mr-2" />
        <h3 className="text-xl font-semibold">Comments</h3>
        <span className="ml-2 text-sm">({comments?.length || 0})</span>
      </div>

      {isAuthenticated ? (
        <div className="new-comment-form mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg mb-2"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="flex items-center px-4 py-2 submit-button text-white rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              <Send size={16} className="mr-2" /> Comment
            </button>
          </div>
        </div>
      ) : (
        <div className="login-prompt mb-6 p-4 rounded-lg text-center flex flex-col gap-2 items-center">
          <p className="mb-2">You need to be logged in to comment</p>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 submit-button text-white font-bold rounded-lg hover:cursor-pointer"
          >
            <LogIn size={16} />
            Login
          </button>
        </div>
      )}

      <div className="comments-list space-y-6">
        {!comments || comments.length === 0 ? (
          <p className="text-center">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-thread">
              <CommentItem
                comment={comment}
                onReply={handleStartReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />

              {replyingTo === comment.id && (
                <div className="reply-form ml-8 mt-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user.username}...`}
                    className="w-full p-2 bg-white text-black border border-gray-300 rounded-md mb-2"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim()}
                      className="flex items-center px-3 py-1 submit-button text-white text-sm rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:cursor-pointer"
                    >
                      <Send size={14} className="mr-1" /> Reply
                    </button>
                    <button
                      onClick={handleCancelReply}
                      className="flex items-center px-3 py-1 submit-button text-white text-sm rounded-md hover:cursor-pointer"
                    >
                      <X size={14} className="mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
