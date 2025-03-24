import { useEffect, useState } from "react";
import useGameStore from "../store/gameStore";
import GameCard from "../components/GameCard";
import { Link } from "react-router-dom";
import { Filter } from "lucide-react";
import FilterDropdown from "../components/FilterDropdown"; // Import the new component
import Pagination from "../components/Pagination";

export default function LatestGames() {
  const {
    latestGames,
    developers,
    platforms,
    genres,
    languages,
    pagination,
    isLatestGamesLoading,
    isDevelopersLoading,
    isPlatformsLoading,
    isGenresLoading,
    isLanguagesLoading,
    latestGamesError,
    developersError,
    platformsError,
    genresError,
    languagesError,
    fetchLatestGames,
    fetchDevelopers,
    fetchPlatforms,
    fetchGenres,
    fetchLanguages,
  } = useGameStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [developersFilters, setDevelopersFilters] = useState<string[]>([]);
  const [platformsFilters, setPlatformsFilters] = useState<string[]>([]);
  const [genresFilters, setGenresFilters] = useState<string[]>([]);
  const [languagesFilters, setLanguagesFilters] = useState<string[]>([]);

  const itemsPerPage = 12;

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    const developersFilterString = developersFilters.join(",");
    const platformsFilterString = platformsFilters.join(",");
    const genresFilterString = genresFilters.join(",");
    const languagesFilterString = languagesFilters.join(",");

    fetchLatestGames(
      currentPage,
      itemsPerPage,
      developersFilterString,
      platformsFilterString,
      genresFilterString,
      languagesFilterString
    );
  }, [
    fetchLatestGames,
    currentPage,
    itemsPerPage,
    developersFilters,
    platformsFilters,
    genresFilters,
    languagesFilters,
  ]);

  const handlePageChange = (pageNumber: number) => {
    const validPage = Math.max(
      1,
      Math.min(pageNumber, pagination?.total_pages || 1)
    );
    setCurrentPage(validPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDevelopersToggle = (developerName: string) => {
    setDevelopersFilters((prev) => {
      if (prev.includes(developerName)) {
        return prev.filter((s) => s !== developerName);
      } else {
        return [...prev, developerName];
      }
    });
    setCurrentPage(1);
  };

  const handlePlatformsToggle = (platformName: string) => {
    setPlatformsFilters((prev) => {
      if (prev.includes(platformName)) {
        return prev.filter((s) => s !== platformName);
      } else {
        return [...prev, platformName];
      }
    });
    setCurrentPage(1);
  };

  const handleGenresToggle = (genreName: string) => {
    setGenresFilters((prev) => {
      if (prev.includes(genreName)) {
        return prev.filter((s) => s !== genreName);
      } else {
        return [...prev, genreName];
      }
    });
    setCurrentPage(1);
  };

  const handleLanguagesToggle = (languageName: string) => {
    setLanguagesFilters((prev) => {
      if (prev.includes(languageName)) {
        return prev.filter((s) => s !== languageName);
      } else {
        return [...prev, languageName];
      }
    });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setDevelopersFilters([]);
    setPlatformsFilters([]);
    setGenresFilters([]);
    setLanguagesFilters([]);
    setCurrentPage(1);
  };

  if (isLatestGamesLoading) {
    return <div className="text-white text-center p-5">Loading...</div>;
  }

  if (latestGamesError) {
    return (
      <div className="text-red-500 text-center p-5">
        Error: {latestGamesError}
      </div>
    );
  }

  if (
    latestGames.length === 0 &&
    developersFilters.length === 0 &&
    platformsFilters.length === 0 &&
    genresFilters.length === 0 &&
    languagesFilters.length === 0
  ) {
    return <div className="text-white text-center p-5">No games available</div>;
  }

  return (
    <div className="flex flex-row justify-between gap-10 mt-25 mb-10 z-10 max-w-7xl w-full mx-auto">
      <div className="w-3/4">
        <h1 className="font-[Black_Ops_One] text-3xl div-header pb-1 mb-5">
          Latest Games
        </h1>

        {/* Game card section */}
        {latestGames.length > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-5">
              {latestGames.map((game) => (
                <Link to="" key={game.id} className="h-85">
                  <GameCard
                    name={game.name}
                    cover_image_url={game.cover_image_url}
                    release_date={new Date(game.release_date)}
                    rating={game.rating}
                  />
                </Link>
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
              No games matching the selected filters
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
      <div className="flex flex-col gap-3 mt-3 w-1/4">
        <div className="font-[Black_Ops_One] text-xl div-header flex gap-1 items-center">
          <h1>Filter</h1>
          <Filter size={20} className="mb-1" />
        </div>
        <div className="flex flex-col p-4 card-background rounded-lg font-[Hubot_Sans] gap-4">
          {/* FilterDropdown component */}
          <FilterDropdown
            label="Developers"
            options={developers}
            selectedOptions={developersFilters}
            isLoading={isDevelopersLoading}
            error={developersError}
            onToggleOption={handleDevelopersToggle}
          />

          <FilterDropdown
            label="Platforms"
            options={platforms}
            selectedOptions={platformsFilters}
            isLoading={isPlatformsLoading}
            error={platformsError}
            onToggleOption={handlePlatformsToggle}
          />

          <FilterDropdown
            label="Genres"
            options={genres}
            selectedOptions={genresFilters}
            isLoading={isGenresLoading}
            error={genresError}
            onToggleOption={handleGenresToggle}
          />

          <FilterDropdown
            label="Languages"
            options={languages}
            selectedOptions={languagesFilters}
            isLoading={isLanguagesLoading}
            error={languagesError}
            onToggleOption={handleLanguagesToggle}
          />

          {/* Reset filters button */}
          <button
            onClick={resetFilters}
            className="filter-button px-4 py-2 rounded-md hover:cursor-pointer mt-2 w-full"
          >
            Reset Filters
          </button>

          <p className="text-sm p-1 text-center">
            Showing {latestGames.length} of {pagination?.total_items || 0} news
            items
          </p>
        </div>
      </div>
    </div>
  );
}
