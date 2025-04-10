import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useSearchStore from "../store/searchStore";
import GameCard from "../components/GameCard";
import NewsCard from "../components/NewsCard";
import Pagination from "../components/Pagination";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const {
    query,
    debouncedQuery,
    setQuery,
    setDebouncedQuery,
    searchType,
    setSearchType,
    results,
    pagination,
    isSearching,
    searchError,
    searchContent,
  } = useSearchStore();

  // This effect only runs once when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get("q") || "";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);

    // Update query from URL
    if (queryParam !== query) {
      setQuery(queryParam);
      setDebouncedQuery(queryParam);
    }

    // Set page from URL
    if (pageParam !== currentPage) {
      setCurrentPage(pageParam);
    }

    // Perform initial search with current search type
    if (queryParam) {
      searchContent(pageParam, 15);
    }

    setIsFirstLoad(false);
  }, []);

  useEffect(() => {
    if (isFirstLoad) return;

    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get("q") || "";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);

    // Only update the query if it changed
    if (queryParam !== query) {
      setQuery(queryParam);
      setDebouncedQuery(queryParam);
    }

    // Only update the page if it changed
    if (pageParam !== currentPage) {
      setCurrentPage(pageParam);
    }

    // Search with current store search type whenever query or page changes
    if (queryParam) {
      searchContent(pageParam, 15);
    }
  }, [location.search]);

  // Handle page changes - only update the page parameter, not type
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.total_pages)) {
      return;
    }

    setCurrentPage(newPage);

    // Update URL with only the page change, preserve query and don't add type
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("page", newPage.toString());
    navigate(`${location.pathname}?${searchParams.toString()}`);

    window.scrollTo({ top: 0, behavior: "smooth" });
    searchContent(newPage, 15);
  };

  // Handle search type change - only update store and perform search, don't update URL
  const handleSearchTypeChange = (type: "games" | "news") => {
    if (type === searchType) return;

    setSearchType(type);

    setCurrentPage(1);

    if (debouncedQuery) {
      setTimeout(() => {
        searchContent(1, 15);
      }, 0);
    }
  };

  // Group results by type for display
  const gameResults = results.filter((result) => result.type === "game");
  const newsResults = results.filter((result) => result.type === "news");

  return (
    <div className="flex flex-col justify-between gap-10 mt-25 mb-10 z-10 max-w-6xl w-full mx-auto">
      <div>
        <h1 className="font-[Black_Ops_One] text-3xl div-header mb-4">
          Search Results {debouncedQuery ? `for "${debouncedQuery}"` : ""}
        </h1>

        {/* Search type filter buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleSearchTypeChange("games")}
            className={`px-4 py-2 rounded-lg text-sm hover:cursor-pointer ${
              searchType === "games" ? "search-option-active" : "search-option"
            }`}
          >
            Games
          </button>
          <button
            onClick={() => handleSearchTypeChange("news")}
            className={`px-4 py-2 rounded-lg text-sm hover:cursor-pointer ${
              searchType === "news" ? "search-option-active" : "search-option"
            }`}
          >
            News
          </button>
        </div>
      </div>

      {!debouncedQuery.trim() ? (
        <div className="card-background p-6 rounded-lg text-center">
          <p>
            Use the search bar in the navigation to search for games and news
            articles
          </p>
        </div>
      ) : isSearching ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 spinner-color"></div>
        </div>
      ) : searchError ? (
        <div className="card-background text-red-500 p-4 rounded-lg text-center">
          Error: {searchError}
        </div>
      ) : results.length === 0 ? (
        <div className="card-background p-6 rounded-lg text-center">
          <p className="text-lg mb-2">
            No results found for "{debouncedQuery}"
          </p>
          <p>Try different keywords or search in a different category</p>
        </div>
      ) : (
        <>
          {/* Games section */}
          {searchType === "games" && gameResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mx-auto">
              {gameResults.map((result) => (
                <Link
                  key={result.id}
                  to={`/games/${result.id}`}
                  className="h-85"
                >
                  <GameCard
                    name={result.name || ""}
                    cover_image_url={result.image_url}
                    release_date={result.release_date || null}
                    rating={result.rating || null}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* News section */}
          {searchType === "news" && newsResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {newsResults.map((result) => (
                <div className="h-50" key={result.id}>
                  <Link to={`/news/${result.id}`}>
                    <NewsCard
                      id={result.id}
                      image_url={result.image_url}
                      title={result.title || ""}
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </>
      )}
    </div>
  );
}
