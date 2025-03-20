import { useEffect, useState } from "react";
import useNewsStore from "../store/newsStore";
import { Link } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import { Filter } from "lucide-react";

export default function News() {
  const {
    news,
    sources,
    pagination,
    isNewsLoading,
    isSourcesLoading,
    newsError,
    sourcesError,
    fetchAllSources,
    fetchPaginatedNews,
  } = useNewsStore();

  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState<string>("1");
  const itemsPerPage = 10;

  // Get all news source name for filters
  useEffect(() => {
    fetchAllSources();
  }, [fetchAllSources]);

  // Get paginated news with or without filters
  useEffect(() => {
    fetchPaginatedNews(currentPage, itemsPerPage, sourceFilter, dateFilter);
  }, [fetchPaginatedNews, currentPage, itemsPerPage, sourceFilter, dateFilter]);

  useEffect(() => {
    console.log(news);
  }, [news]);

  // Handles the page change in pagination
  const handlePageChange = (pageNumber: number) => {
    const validPage = Math.max(
      1,
      Math.min(pageNumber, pagination?.total_pages || 1)
    );
    setCurrentPage(validPage);
    setInputPage(validPage.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handles input change for page number
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  // Handles key press for page change
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const pageNumber = parseInt(inputPage, 10);
      if (!isNaN(pageNumber)) {
        handlePageChange(pageNumber);
      }
    }
  };

  // Filter reseter
  const resetFilters = () => {
    setSourceFilter("");
    setDateFilter("");
    setCurrentPage(1);
  };

  if (isNewsLoading) {
    return <div className="text-white text-center p-5">Loading...</div>;
  }

  if (newsError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {newsError}</div>
    );
  }

  if (news.length === 0 && !sourceFilter && !dateFilter) {
    return <div className="text-white text-center p-5">No news available</div>;
  }

  return (
    <div className="flex flex-row justify-between gap-10 mt-25 mb-10 z-10 max-w-6xl w-full mx-auto">
      <div className="w-3/4">
        <h1 className="font-[Black_Ops_One] text-3xl div-header pb-1 mb-5">
          News
        </h1>

        {/* News card section */}
        {news.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-5">
              {news.map((data) => (
                <Link to="">
                  <NewsCard
                    id={data.id}
                    title={data.title}
                    image_url={data.image_url}
                  />
                </Link>
              ))}
            </div>

            {/* Pagination buttons */}
            {pagination && pagination.total_pages > 0 && (
              <div className="flex justify-center items-center mt-8 gap-3 font-[Hubot_Sans] font-semibold">
                <button
                  onClick={() =>
                    handlePageChange(
                      pagination.page > 1 ? pagination.page - 1 : 1
                    )
                  }
                  disabled={pagination.page === 1}
                  className="px-5 py-2 custom-button text-white rounded-lg hover:cursor-pointer 
                  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <h3 className="px-5">
                  Page
                  <input
                    type="number"
                    value={inputPage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    min="1"
                    max={pagination.total_pages || 1}
                    className="text-neutral-900 bg-white mx-2 rounded-sm border border-neutral-800 text-center w-10
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  of {pagination.total_pages || 1}
                </h3>
                <button
                  onClick={() =>
                    handlePageChange(
                      pagination.page < pagination.total_pages
                        ? pagination.page + 1
                        : pagination.total_pages
                    )
                  }
                  disabled={pagination.page === pagination.total_pages}
                  className="px-5 py-2 custom-button text-white rounded-lg hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="px-5 py-8 card-background font-[Hubot_Sans] rounded-lg flex flex-col items-center justify-center gap-2">
            <p className="text-xl font-bold">
              No news matching the selected filters
            </p>
            <p className="text-lg">Try adjusting your filters or</p>
            <button
              onClick={resetFilters}
              className="filter-button px-4 py-2 rounded-md hover:cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Side*/}
      <div className="flex flex-col gap-5 mt-2 w-1/4">
        <div className="font-[Black_Ops_One] text-2xl div-header flex gap-2 items-center">
          <h1>Filter</h1>
          <Filter size={20} />
        </div>
        <div className="flex flex-col p-4 card-background rounded-lg font-[Hubot_Sans]">
          <h2 className="block font-bold">Source:</h2>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            disabled={isSourcesLoading}
            className="w-full p-2 filter-button mt-2 rounded-sm hover:cursor-pointer"
          >
            <option value="">All Sources</option>
            {sources.map((source) => (
              <option key={source.id} value={source.name}>
                {source.name}
              </option>
            ))}
          </select>
          {sourcesError && (
            <p className="text-red-400 mt-1 text-xs">Error loading sources</p>
          )}
          <h2 className="block font-bold mt-3">Published:</h2>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 filter-button mt-2 rounded-sm hover:cursor-pointer"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="older">Older than a week</option>
          </select>
          <button
            onClick={resetFilters}
            className="filter-button px-4 py-2 mt-4 w-full rounded-md hover:cursor-pointer"
          >
            Reset Filters
          </button>

          <p className="mt-4 text-sm p-1 text-center">
            Showing {news.length} of {pagination?.total_items || 0} news items
          </p>
        </div>
      </div>
    </div>
  );
}
