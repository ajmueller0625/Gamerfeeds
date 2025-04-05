import { Link } from "react-router-dom";
import { SearchResult } from "../store/searchStore";
import useSearchStore from "../store/searchStore";

interface SearchDropdownProps {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export default function SearchDropdown({
  results,
  isLoading,
  error,
  onClose,
}: SearchDropdownProps) {
  const { query } = useSearchStore();

  if (isLoading) {
    return (
      <div className="absolute top-full mt-1 w-full nav-ul-background z-50 max-h-96 overflow-y-auto">
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 spinner-color"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-full mt-1 w-full nav-ul-background rounded-lg z-50">
        <div className="p-3 text-red-500">{error}</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full mt-1 w-full nav-ul-background rounded-lg z-50">
        <div className="p-3 text-neutral-500 dark:text-neutral-400">
          No results found
        </div>
      </div>
    );
  }

  // Group results by type
  const gameResults = results
    .filter((result) => result.type === "game")
    .slice(0, 3);
  const newsResults = results
    .filter((result) => result.type === "news")
    .slice(0, 3);

  return (
    <div className="absolute top-full mt-1 w-full nav-ul-background rounded-lg z-50 max-h-96 overflow-y-auto search-results-container">
      {gameResults.length > 0 && (
        <div>
          <div className="p-2 font-semibold text-sm search-dropdown-border">
            Games
          </div>
          {gameResults.map((result) => (
            <Link
              key={result.id}
              to={`/games/${result.id}`}
              onClick={onClose}
              className="block search-dropdown search-dropdown-border"
            >
              <div className="p-2 flex items-center space-x-2">
                <img
                  src={result.image_url}
                  alt={result.name}
                  className="w-10 h-10 object-cover rounded"
                />
                <div>
                  <div className="font-medium">{result.name}</div>
                  {result.release_date && (
                    <div className="text-xs">
                      {new Date(result.release_date).getFullYear()}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {newsResults.length > 0 && (
        <div>
          <div className="p-2 font-semibold text-sm search-dropdown-border">
            News
          </div>
          {newsResults.map((result) => (
            <Link
              key={result.id}
              to={`/news/${result.id}`}
              onClick={onClose}
              className="block search-dropdown search-dropdown-border"
            >
              <div className="p-2 flex items-center space-x-2">
                <img
                  src={result.image_url}
                  alt={result.title}
                  className="w-10 h-10 object-cover rounded"
                />
                <div>
                  <div className="font-medium">{result.title}</div>
                  {result.published && (
                    <div className="text-xs">
                      {new Date(result.published).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        to={`/search?q=${encodeURIComponent(query)}&type=games`}
        onClick={onClose}
        className="block p-3 text-center text-sm search-dropdown"
      >
        See all results
      </Link>
    </div>
  );
}
