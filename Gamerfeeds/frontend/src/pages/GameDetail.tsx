import { useParams, useNavigate } from "react-router-dom";
import useGameStore from "../store/gameStore";
import { useEffect, useState } from "react";
import GameCarousel from "../components/GameCarousel";
import CommentsSection from "../components/CommentsSection";
import { Star, StarHalf } from "lucide-react";

export default function GameDetail() {
  const { gameID } = useParams<{ gameID: string }>();
  const { game, isGameLoading, gameError, fetchGameByID } = useGameStore();
  const navigate = useNavigate();
  const [dataChecked, setDataChecked] = useState(false);

  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return "N/A";

    // Convert to 0-5 scale
    const starRating = (rating / 100) * 5;

    // Round to nearest half star
    const roundedStarRating = Math.round(starRating * 2) / 2;

    const stars = [];

    // Add filled stars
    for (let i = 1; i <= Math.floor(roundedStarRating); i++) {
      stars.push(
        <Star
          key={`star-${i}`}
          size={16}
          className="text-yellow-400 fill-yellow-400"
        />
      );
    }

    // Add half star if needed
    if (roundedStarRating % 1 !== 0) {
      stars.push(
        <StarHalf
          key="half-star"
          size={16}
          className="text-yellow-400 fill-yellow-400"
        />
      );
    }

    // Add empty stars
    for (let i = Math.ceil(roundedStarRating); i < 5; i++) {
      stars.push(
        <Star key={`empty-star-${i}`} size={16} className="text-gray-400" />
      );
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-xs text-gray-400">({rating}/100)</span>
      </div>
    );
  };

  useEffect(() => {
    // Check if the ID is a valid number
    const numericID = Number(gameID);

    if (isNaN(numericID)) {
      // If ID is not a valid number, redirect immediately to 404
      navigate("/not-found", { replace: true });
      return;
    }

    fetchGameByID(numericID);
  }, [fetchGameByID, gameID, navigate]);

  useEffect(() => {
    if (!isGameLoading && game.length === 0 && !dataChecked) {
      setDataChecked(true);
      // Add a small delay to ensure all state updates are complete
      const timer = setTimeout(() => {
        navigate("/not-found", { replace: true });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isGameLoading, game, navigate, dataChecked]);

  if (isGameLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 spinner-color"></div>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {gameError}</div>
    );
  }

  if (game.length === 0 && !isGameLoading) {
    // We'll handle redirection in the useEffect above
    return null;
  }

  const currentGame = game[0];

  return (
    <div className="max-w-7xl mt-25 mx-auto z-10 pb-10">
      {/* Original Header */}
      <h1 className="font-[Black_Ops_One] text-3xl div-header mb-5">
        Game Details
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left Column - Cover Image and Key Info */}
        <div className="card-background p-4 rounded-lg">
          {/* Cover Image */}
          <div className="mb-4">
            <img
              src={currentGame.cover_image_url}
              alt={`${currentGame.name} cover image`}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Game Title under cover */}
          <h2 className="text-xl font-bold mb-3">{currentGame.name}</h2>

          {/* Key Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Release Date</h3>
              <p>{formatDate(new Date(currentGame.release_date))}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-1">Developers</h3>
              <div className="flex flex-wrap gap-1">
                {currentGame.developers && currentGame.developers.length > 0 ? (
                  currentGame.developers.map((developer, index) => (
                    <span
                      key={index}
                      className="text-sm bg-small-card rounded-lg p-1"
                    >
                      {developer}
                    </span>
                  ))
                ) : (
                  <span className="text-sm">N/A</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-1">Genres</h3>
              <div className="flex flex-wrap gap-1">
                {currentGame.genres && currentGame.genres.length > 0 ? (
                  currentGame.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="text-sm bg-small-card rounded-lg p-1"
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="text-sm">N/A</span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="font-semibold text-lg mb-1">Rating</h3>
              {renderStars(currentGame.rating)}
            </div>
          </div>
        </div>

        {/* Middle and Right Columns - Media and Description */}
        <div className="lg:col-span-2 space-y-4">
          {/* Media Carousel */}
          {(currentGame.screenshots && currentGame.screenshots.length > 0) ||
          (currentGame.videos && currentGame.videos.length > 0) ? (
            <div className="card-background rounded-lg p-3">
              <GameCarousel
                screenshots={currentGame.screenshots || []}
                videos={currentGame.videos || []}
              />
            </div>
          ) : null}

          {/* Game Summary */}
          <div className="card-background rounded-lg p-4">
            <h2 className="font-semibold text-xl mb-2">About This Game</h2>
            <p className="leading-relaxed">
              {currentGame.summary ? currentGame.summary : "N/A"}
            </p>
          </div>

          {/* Game Details */}
          <div className="card-background rounded-lg p-4">
            <h2 className="font-semibold text-xl mb-2">System Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Languages */}
              <div>
                <h3 className="font-semibold mb-2">Languages Supported</h3>
                <div className="flex flex-wrap gap-1">
                  {currentGame.languages && currentGame.languages.length > 0 ? (
                    currentGame.languages.map((language, index) => (
                      <span
                        key={index}
                        className="text-xs bg-small-card rounded-lg p-1"
                      >
                        {language}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs">N/A</span>
                  )}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <h3 className="font-semibold mb-2">Platforms</h3>
                <div className="flex flex-wrap gap-1">
                  {currentGame.platforms && currentGame.platforms.length > 0 ? (
                    currentGame.platforms.map((platform, index) => (
                      <span
                        key={index}
                        className="text-xs bg-small-card rounded-lg p-1"
                      >
                        {platform}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs">N/A</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="p-4 mt-6">
        <CommentsSection contentType="game" contentId={Number(gameID)} />
      </div>
    </div>
  );
}
