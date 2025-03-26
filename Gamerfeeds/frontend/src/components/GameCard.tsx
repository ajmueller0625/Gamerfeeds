import { Star, StarHalf } from "lucide-react";

interface GameData {
  name: string;
  cover_image_url: string;
  release_date: Date;
  rating: number | null;
}

export default function GameCard({
  name,
  cover_image_url,
  release_date,
  rating,
}: GameData) {
  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  // Convert rating to stars (0-100 scale to 0-5 stars)
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

  return (
    <div className="flex flex-col justify-between p-3 gap-2 rounded-lg w-full h-full card-background transition-all duration-300 transform hover:scale-105">
      <div className="overflow-hidden w-full h-70 rounded-lg">
        <img
          src={cover_image_url}
          alt={`Cover: ${name}`}
          className="w-full h-full"
        />
      </div>
      <div className="font-[Hubot_Sans] rounded-b-lg text-sm">
        <h3>
          <span className="font-bold">Name: </span> {name}
        </h3>
        <h3>
          <span className="font-bold">Release Date: </span>
          {formatDate(release_date)}
        </h3>
        <h3 className="flex flex-row gap-1">
          <span className="font-bold">Rating: </span> {renderStars(rating)}
        </h3>
      </div>
    </div>
  );
}
