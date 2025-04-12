import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, AlertTriangle } from "lucide-react";
import useAuthStore from "../store/authStore";
import useDiscussionStore from "../store/discussionStore";

export default function NewDiscussion() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");

  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { createDiscussion, isLoading, error, clearError } =
    useDiscussionStore();

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: "/discussion/new" } });
    }
  }, [token, navigate]);

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

    // Clear any previous errors
    clearError();

    if (!validateForm()) {
      return;
    }

    const result = await createDiscussion({
      title: title.trim(),
      content: content.trim(),
    });

    if (result) {
      // Navigate to the newly created discussion
      navigate(`/discussion/${result.id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mt-25 z-10 mx-auto">
      <h1 className="text-3xl font-[Black_Ops_One] mb-5 div-header">
        Create New Discussion
      </h1>
      <div>
        <button
          onClick={() => navigate("/discussion")}
          className="flex items-center mb-8 px-4 py-2 rounded-lg submit-button hover:cursor-pointer text-white"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Discussions
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
              disabled={isLoading}
              className="flex items-center px-6 py-3 submit-button text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Create Discussion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
