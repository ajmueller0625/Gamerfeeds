import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Plus, Calendar, Clock, User } from "lucide-react";
import useDiscussionStore from "../store/discussionStore";
import useAuthStore from "../store/authStore";
import Pagination from "../components/Pagination";

export default function Discussion() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();
  const { token } = useAuthStore();
  const {
    discussions,
    isLoading,
    error,
    totalDiscussions,
    fetchDiscussions,
    fetchTotalCount,
  } = useDiscussionStore();

  useEffect(() => {
    // Fetch total count first
    fetchTotalCount();

    // Then fetch discussions for the current page
    fetchDiscussions(currentPage, itemsPerPage);
  }, [currentPage, fetchDiscussions, fetchTotalCount]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalDiscussions / itemsPerPage);

  return (
    <div className="flex flex-col min-h-screen mt-25 z-10">
      <div className="max-w-7xl mx-auto w-full">
        <div className="items-center mb-6">
          <h1 className="text-3xl font-[Black_Ops_One] div-header">
            Community Discussions
          </h1>
        </div>

        <div className="flex justify-end mb-6">
          {token ? (
            <button
              onClick={() => navigate("/discussion/new")}
              className="flex items-center gap-2 px-4 py-2 submit-button text-white rounded-lg hover:cursor-pointer"
            >
              <Plus size={18} />
              New Discussion
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 submit-button text-white rounded-lg hover:cursor-pointer"
            >
              Log in to start a discussion
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 spinner-color"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 rounded-lg text-center">
            <p>{error}</p>
            <button
              onClick={() => fetchDiscussions(currentPage, itemsPerPage)}
              className="mt-4 px-4 py-2 submit-button text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No discussions yet</h3>
            <p className="mb-4">
              Be the first to start a discussion in our community!
            </p>
            {token ? (
              <button
                onClick={() => navigate("/discussion/new")}
                className="px-4 py-2 submit-button text-white rounded-lg hover:cursor-pointer"
              >
                Start a Discussion
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 submit-button text-white rounded-lg inline-block"
              >
                Log in to start a discussion
              </Link>
            )}
          </div>
        ) : (
          <>
            {discussions.map((discussion) => (
              <div className="discussion-background flex flex-col gap-5 rounded-lg mb-6 max-w-5xl mx-auto">
                <Link key={discussion.id} to={`/discussion/${discussion.id}`}>
                  <div className="p-6">
                    <div className="flex justify-between mb-2">
                      <h2 className="text-xl font-semibold hover:underline line-clamp-1">
                        {discussion.title}
                      </h2>
                      <div className="flex items-center text-sm">
                        <MessageCircle size={14} className="mr-1" />
                        <span>{discussion.comment_count}</span>
                      </div>
                    </div>

                    <p className="text-base opacity-80 mb-3 line-clamp-2">
                      {discussion.content}
                    </p>

                    <div className="flex flex-wrap items-center text-xs md:text-sm opacity-70">
                      <div className="flex items-center mr-4">
                        <User size={14} className="mr-1" />
                        <span>{discussion.user.username}</span>
                      </div>
                      <div className="flex items-center mr-4">
                        <Calendar size={14} className="mr-1" />
                        <span>{formatDate(discussion.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        <span>{formatTime(discussion.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mb-8"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
