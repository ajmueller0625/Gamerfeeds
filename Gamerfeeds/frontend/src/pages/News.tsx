import { useEffect, useState } from "react";
import useNewsStore from "../store/newsStore";
import { Link } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import { Filter } from "lucide-react";
import Pagination from "../components/Pagination";
import FilterDropdown from "../components/FilterDropdown";

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

  // Changed from string to string[] for multiple source selection
  const [sourceFilters, setSourceFilters] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get all news source name for filters
  useEffect(() => {
    fetchAllSources();
  }, [fetchAllSources]);

  // Get paginated news with or without filters
  useEffect(() => {
    // Convert sourceFilters array to a comma-separated string
    const sourceFilterString = sourceFilters.join(",");
    fetchPaginatedNews(
      currentPage,
      itemsPerPage,
      sourceFilterString,
      dateFilter
    );
  }, [
    fetchPaginatedNews,
    currentPage,
    itemsPerPage,
    sourceFilters,
    dateFilter,
  ]);

  // Handles the page change in pagination
  const handlePageChange = (pageNumber: number) => {
    const validPage = Math.max(
      1,
      Math.min(pageNumber, pagination?.total_pages || 1)
    );
    setCurrentPage(validPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle source checkbox toggle
  const handleSourceToggle = (sourceName: string) => {
    setSourceFilters((prev) => {
      if (prev.includes(sourceName)) {
        return prev.filter((s) => s !== sourceName);
      } else {
        return [...prev, sourceName];
      }
    });
    setCurrentPage(1);
  };

  // Handle date filter change
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  // Filter reseter
  const resetFilters = () => {
    setSourceFilters([]);
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

  if (news.length === 0 && sourceFilters.length === 0 && !dateFilter) {
    return <div className="text-white text-center p-5">No news available</div>;
  }

  return (
    <div className="flex flex-row justify-between gap-10 mt-25 mb-10 z-10 max-w-7xl w-full mx-auto">
      <div className="w-3/4">
        <h1 className="font-[Black_Ops_One] text-3xl div-header pb-1 mb-5">
          News
        </h1>

        {/* News card section */}
        {news.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-5">
              {news.map((data) => (
                <div className="h-65">
                  <Link to={`/news/${data.id}`} key={data.id} className="h-80">
                    <NewsCard
                      id={data.id}
                      title={data.title}
                      image_url={data.image_url}
                    />
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination component */}
            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
                className="mt-8"
              />
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
      <div className="flex flex-col gap-5 mt-3 w-1/4">
        <div className="font-[Black_Ops_One] text-xl div-header flex gap-1 items-center">
          <h1>Filter</h1>
          <Filter size={20} className="mb-1" />
        </div>
        <div className="flex flex-col gap-1 p-4 card-background rounded-lg font-[Hubot_Sans]">
          {/* Multi-select dropdown for sources */}
          <FilterDropdown
            label="Sources"
            options={sources}
            selectedOptions={sourceFilters}
            isLoading={isSourcesLoading}
            error={sourcesError}
            onToggleOption={handleSourceToggle}
          />

          {/* Radio buttons for date filter */}
          <h2 className="block font-bold mt-4">Published:</h2>
          <div className="mt-2 space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={dateFilter === ""}
                onChange={() => handleDateFilterChange("")}
                className="mr-2"
              />
              <span>All Time</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={dateFilter === "today"}
                onChange={() => handleDateFilterChange("today")}
                className="mr-2"
              />
              <span>Today</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={dateFilter === "week"}
                onChange={() => handleDateFilterChange("week")}
                className="mr-2"
              />
              <span>Last 7 days</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={dateFilter === "older"}
                onChange={() => handleDateFilterChange("older")}
                className="mr-2"
              />
              <span>Older than a week</span>
            </label>
          </div>

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
