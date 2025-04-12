import { useState } from "react";
import { UserCircle, MessageSquare, Edit, Trash, Save, X } from "lucide-react";
import useAuthStore from "../store/authStore";
import { Comment } from "../types/comment";

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: number) => void;
  onEdit: (commentId: number, content: string) => void;
  onDelete: (commentId: number) => void;
  depth?: number;
}

export default function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: CommentItemProps) {
  // Use userData instead of user to match your authStore
  const { userData, token } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first two levels

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleEditSubmit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  // Check if user is authenticated and is the comment author
  const isAuthenticated = !!token;
  const isOwnComment = userData?.id === comment.user_id;
  const maxDepth = 5; // Maximum nesting level for replies

  return (
    <div
      className={`comment-item ${
        depth > 0 ? "ml-4 pl-4 border-l border-gray-600" : ""
      }`}
    >
      <div className="comment-header flex items-center mb-2">
        {comment.user.avatar ? (
          <img
            src={comment.user.avatar}
            alt={`${comment.user.username}'s avatar`}
            className="h-8 w-8 rounded-full mr-2"
          />
        ) : (
          <UserCircle className="h-8 w-8 mr-2 text-gray-400" />
        )}
        <span className="font-semibold text-sm mr-2">
          {comment.user.username}
        </span>
        <span className="text-xs text-gray-400">
          {formatDate(comment.created_at)}
        </span>
        {comment.updated_at !== comment.created_at && (
          <span className="text-xs text-gray-500 ml-2">(edited)</span>
        )}
      </div>

      <div className="comment-body mb-2">
        {isEditing ? (
          <div className="edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 bg-white text-black border border-gray-300 rounded-md mb-2 text-sm"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleEditSubmit}
                className="flex items-center px-2 py-1 submit-button text-white text-xs rounded-md hover:cursor-pointer"
              >
                <Save size={14} className="mr-1" /> Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center px-2 py-1 submit-button text-white text-xs rounded-md hover:cursor-pointer"
              >
                <X size={14} className="mr-1" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>

      <div className="comment-actions flex items-center space-x-4 mb-2">
        {/* Allow replies only from other users, not the comment author */}
        {isAuthenticated && !isOwnComment && (
          <button
            onClick={() => onReply(comment.id)}
            className="flex items-center text-xs hover:text-blue-500 hover:cursor-pointer"
          >
            <MessageSquare size={14} className="mr-1" /> Reply
          </button>
        )}

        {isOwnComment && !isEditing && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center text-xs hover:text-blue-500 hover:cursor-pointer"
            >
              <Edit size={14} className="mr-1" /> Edit
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center text-xs hover:text-red-500 hover:cursor-pointer"
            >
              <Trash size={14} className="mr-1" /> Delete
            </button>
          </>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="text-xs submit-button text-white px-2 py-1 rounded mt-2 hover:cursor-pointer"
            >
              Show {comment.replies.length}{" "}
              {comment.replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              {depth < maxDepth && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs submit-button text-white px-2 py-1 rounded mt-2 mb-2 hover:cursor-pointer"
                >
                  Hide replies
                </button>
              )}
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
