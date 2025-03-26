import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MediaItem {
  type: "image" | "video";
  url: string;
}

export default function GameCarousel({
  screenshots = [],
  videos = [],
}: {
  screenshots: string[];
  videos: string[];
}) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const combinedMedia: MediaItem[] = [
      ...screenshots.map((url) => ({ type: "image" as const, url })),
      ...videos.map((url) => ({ type: "video" as const, url })),
    ];
    setMediaItems(combinedMedia);
  }, [screenshots, videos]);

  const handleNextImage = () => {
    setCurrentIndex((nextIndex) => (nextIndex + 1) % mediaItems.length);
  };

  const handlePrevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + mediaItems.length) % mediaItems.length
    );
  };

  const goToIndex = (index: number) => {
    if (isPlaying) {
      setIsPlaying(false);
    }

    if (index < 0) {
      setCurrentIndex(mediaItems.length - 1);
    } else if (index >= mediaItems.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(index);
    }
  };

  if (mediaItems.length === 0) {
    return null;
  }

  const currentItem = mediaItems[currentIndex];

  return (
    <div
      className="relative w-full bg-black rounded-lg overflow-hidden"
      ref={carouselRef}
    >
      <div className="relative aspect-video w-full">
        {currentItem.type === "image" ? (
          <img
            src={currentItem.url}
            alt={`Screenshot ${currentIndex}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <iframe
              src={`https://youtube.com/embed/${currentItem.url}`}
              className="w-full h-full object-contain"
              title="YouTube video"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        <button
          onClick={handlePrevImage}
          className="absolute top-1/2 start-2 flex justify-center text-white rounded-full
             hover:bg-neutral-600/50 hover:cursor-pointer p-2"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNextImage}
          className="absolute top-1/2 end-2 flex justify-center text-white rounded-full
             hover:bg-neutral-600/50 hover:cursor-pointer p-2"
        >
          <ChevronRight size={20} />
        </button>

        {/* Counter */}
        <div className="absolute top-2 right-2 bg-black/30 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {mediaItems.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="p-2 overflow-x-auto flex justify-center">
        <div className="flex space-x-2">
          {mediaItems.map((item, index) => (
            <div
              key={index}
              className={`relative flex-shrink-0 w-24 h-16 cursor-pointer ${
                index === currentIndex ? "ring-2 ring-blue-300 rounded-lg" : ""
              }`}
              onClick={() => goToIndex(index)}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={`Thumbnail ${index}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={`https://img.youtube.com/vi/${item.url}/mqdefault.jpg`}
                    alt={`Video thumbnail ${index}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
