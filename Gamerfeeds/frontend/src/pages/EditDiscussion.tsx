import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import useAuthStore from "../store/authStore";
import useDiscussionStore from "../store/discussionStore";

export default function EditDiscussion() {
  const { discussionId } = useParams<{ discussionId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userData, token } = useAuthStore();
  const {
    currentDiscussion,
    isLoading,
    error,
    fetchDiscussion,
    updateDiscussion,
    clearError,
  } = useDiscussionStore();

  // Fetch discussion data
  useEffect(() => {
    if (discussionId) {
      fetchDiscussion(parseInt(discussionId));
    }
  }, [discussionId, fetchDiscussion]);

  // Populate form with discussion data
  useEffect(() => {
    if (currentDiscussion) {
      setTitle(currentDiscussion.title);
      setContent(currentDiscussion.content);
    }
  }, [currentDiscussion]);

  // Redirect if not logged in or not the author
  useEffect(() => {
    if (!token) {
      navigate("/login", {
        state: { from: `/discussion/edit/${discussionId}` },
      });
      return;
    }

    if (currentDiscussion && userData) {
      if (currentDiscussion.user_id !== userData.id) {
        navigate(`/discussion/${discussionId}`);
      }
    }
  }, [token, currentDiscussion, userData, discussionId, navigate]);

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setTitleError("");
    setContentError("");

    // Validate title
    if (!title.trim()) {
      setTitleError("Title is required");
      isValid = false;
    } else if (title.trim().length < 3) {
      setTitleError("Title must be at least 3 characters");
      isValid = false;
    } else if (title.trim().length > 255) {
      setTitleError("Title must be less than 255 characters");
      isValid = false;
    }

    // Validate content
    if (!content.trim()) {
      setContentError("Content is required");
      isValid = false;
    } else if (content.trim().length < 10) {
      setContentError("Content must be at least 10 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discussionId) return;

    // Clear any previous errors
    clearError();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateDiscussion(parseInt(discussionId), {
        title: title.trim(),
        content: content.trim(),
      });

      // Navigate back to the discussion
      navigate(`/discussion/${discussionId}`);
    } catch (err) {
      console.error("Error updating discussion:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !currentDiscussion) {
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
          onClick={() => navigate(`/discussion/${discussionId}`)}
          className="px-4 py-2 submit-button text-white rounded-lg"
        >
          Go back to Discussion
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
            The discussion you're trying to edit doesn't exist or has been
            removed.
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
    <div className="flex flex-col min-h-screen max-w-7xl z-10 mt-25 mx-auto">
      <h1 className="text-3xl font-[Black_Ops_One] div-header mb-5">
        Edit Discussion
      </h1>
      <div>
        <button
          onClick={() => navigate(`/discussion/${discussionId}`)}
          className="flex items-center submit-button px-4 py-2 rounded-lg mb-8 hover:cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Discussion
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full mb-8 card-background p-10 rounded-lg">
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 rounded-lg p-4 mb-6 flex items-start">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block mb-2 font-medium">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your discussion"
              className={`w-full p-3 rounded-lg bg-white text-black ${
                titleError
                  ? "border-2 border-red-500"
                  : "border border-gray-300"
              }`}
            />
            {titleError && (
              <p className="text-red-500 text-sm mt-1">{titleError}</p>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block mb-2 font-medium">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your discussion content here..."
              rows={10}
              className={`w-full p-3 rounded-lg bg-white text-black ${
                contentError
                  ? "border-2 border-red-500"
                  : "border border-gray-300"
              }`}
            />
            {contentError && (
              <p className="text-red-500 text-sm mt-1">{contentError}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex items-center px-6 py-3 submit-button text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
