import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash,
  Calendar,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import CommentsSection from "../components/CommentsSection";
import useDiscussionStore from "../store/discussionStore";
import useAuthStore from "../store/authStore";
import ConfirmDialog from "../components/ConfirmDialog";

export default function DiscussionDetail() {
  const { discussionId } = useParams<{ discussionId: string }>();
  const navigate = useNavigate();

  const { userData } = useAuthStore();
  const {
    currentDiscussion,
    isLoading,
    error,
    fetchDiscussion,
    deleteDiscussion,
  } = useDiscussionStore();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (discussionId) {
      fetchDiscussion(parseInt(discussionId));
    }

    return () => {
      // Clear current discussion on unmount
      useDiscussionStore.getState().clearCurrentDiscussion();
    };
  }, [discussionId, fetchDiscussion]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!discussionId) return;

    setIsDeleting(true);
    try {
      await deleteDiscussion(parseInt(discussionId));
      navigate("/discussion");
    } catch (err) {
      console.error("Error deleting discussion:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Check if the current user is the author of the discussion
  const isAuthor =
    userData && currentDiscussion
      ? userData.id === currentDiscussion.user_id
      : false;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 spinner-color"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 rounded-lg p-4 mb-6 max-w-xl w-full flex items-start">
          <AlertTriangle size={24} className="mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-bold mb-1">Error</h3>
            <p>{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/discussion")}
          className="px-4 py-2 submit-button text-white rounded-lg"
        >
          Go back to Discussions
        </button>
      </div>
    );
  }

  if (!currentDiscussion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Discussion not found</h2>
          <p>
            The discussion you're looking for doesn't exist or has been removed.
          </p>
        </div>
        <button
          onClick={() => navigate("/discussion")}
          className="px-4 py-2 submit-button text-white rounded-lg"
        >
          Go back to Discussions
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen mt-25 z-10 max-w-7xl mx-auto">
      <h1 className="font-[Black_Ops_One] text-3xl div-header mb-5">
        Discussion Detail
      </h1>
      <div className="mb-8">
        <button
          onClick={() => navigate("/discussion")}
          className="submit-button px-4 py-2 rounded-lg text-white flex items-center mb-6 hover:cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Discussions
        </button>

        <div className="max-w-4xl mx-auto w-full card-background p-10 rounded-lg">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">
              {currentDiscussion.title}
            </h1>

            <div className="flex items-center mb-4 text-sm">
              <div className="mr-4 flex items-center">
                <User size={16} className="mr-1" />
                <span>{currentDiscussion.user.username}</span>
              </div>
              <div className="flex items-center mr-4">
                <Calendar size={16} className="mr-1" />
                <span>{formatDate(currentDiscussion.created_at)}</span>
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>{formatTime(currentDiscussion.created_at)}</span>
              </div>

              {currentDiscussion.updated_at !==
                currentDiscussion.created_at && (
                <div className="ml-4 text-sm opacity-70">(edited)</div>
              )}
            </div>

            {/* Author actions */}
            {isAuthor && (
              <div className="flex gap-4 mb-4">
                <Link
                  to={`/discussion/edit/${currentDiscussion.id}`}
                  className="flex items-center text-sm hover:underline hover:text-blue-500"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </Link>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center text-sm text-red-500 hover:underline hover:cursor-pointer"
                >
                  <Trash size={16} className="mr-1" />
                  Delete
                </button>
              </div>
            )}

            {/* Discussion content */}
            <div className="bg-card-background rounded-lg p-6 whitespace-pre-wrap">
              {currentDiscussion.content}
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="max-w-4xl mx-auto pt-6">
          <CommentsSection
            contentType="discussion"
            contentId={currentDiscussion.id}
          />
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Discussion"
          message="Are you sure you want to delete this discussion? This action cannot be undone."
          confirmButtonText={isDeleting ? "Deleting..." : "Delete"}
          cancelButtonText="Cancel"
          isConfirmDestructive={true}
          isConfirmLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
