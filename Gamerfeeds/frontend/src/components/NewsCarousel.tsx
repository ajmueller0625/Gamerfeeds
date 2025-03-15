import { useCallback, useEffect, useRef, useState } from "react";
import useNewsStore from "../store/newsStore";
import { AnimatePresence, motion } from "framer-motion";

export default function NewsCarousel() {
  const { news, isLoading, error, fetchLatestNews } = useNewsStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const CAROUSEL_ITEM_COUNT = 10;

  useEffect(() => {
    fetchLatestNews(CAROUSEL_ITEM_COUNT);
  }, [fetchLatestNews, CAROUSEL_ITEM_COUNT]);

  const carouselData = news
    .filter((item) => item && item.id && item.title && item.image_url)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      image_url: item.image_url,
      description: item.description || "",
    }));

  const cardData = news
    .filter((item) => item && item.id && item.title && item.image_url)
    .slice(5, 11)
    .map((item) => ({
      id: item.id,
      title: item.title,
      image_url: item.image_url,
      description: item.description,
    }));

  useEffect(() => {
    console.log(carouselData);
  }, [carouselData]);

  const intervalRef = useRef<number | null>(null);

  const nextImage = useCallback(() => {
    if (carouselData.length > 0) {
      setDirection(1);
      setCurrentIndex((nextIndex) => (nextIndex + 1) % carouselData.length);
    }
  }, [carouselData.length]);

  const resetInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(nextImage, 5000);
  }, [nextImage]);

  const prevImage = useCallback(() => {
    if (carouselData.length > 0) {
      setDirection(-1);
      setCurrentIndex(
        (prevIndex) =>
          (prevIndex - 1 + carouselData.length) % carouselData.length
      );
    }
  }, [carouselData.length]);

  const handleNextImage = () => {
    nextImage();
    resetInterval();
  };

  const handlePrevImage = () => {
    prevImage();
    resetInterval();
  };

  const changeImage = (index: number) => {
    setCurrentIndex(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    resetInterval();
  };

  useEffect(() => {
    if (carouselData.length > 0) {
      resetInterval();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [cardData, resetInterval]);

  useEffect(() => {
    if (carouselData.length > 0) {
      setCurrentIndex(0);
    }
  }, [carouselData.length]);

  //Change Later
  if (isLoading) {
    return <div className="text-white text-center p-5">Loading news...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-5">Error: {error}</div>;
  }

  if (carouselData.length === 0) {
    return <div className="text-white text-center p-5">No news available</div>;
  }

  return (
    <div className="w-full mx-auto mt-25 z-10">
      <div className="max-w-5xl mx-auto my-5">
        <h1 className="font-[Black_Ops_One] text-3xl div-header pb-1">
          Latest News
        </h1>
      </div>
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
        <div className="relative col-span-2 row-span-2 overflow-hidden rounded-lg w-full h-100">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={carouselData[currentIndex].id}
              className="absolute w-full h-full object-cover flex items-center justify-center"
              initial={{ x: direction * 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 100, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <img
                src={carouselData[currentIndex].image_url}
                alt={`Slide: ${carouselData[currentIndex].title}`}
                className="absolute w-full h-full object-cover"
              />
              <div className="font-[Hubot_Sans] absolute start-0 bottom-0 w-full px-10 py-5 bg-neutral-900/50 text-white">
                <h3 className="text-xl font-bold underline">
                  {carouselData[currentIndex].title}
                </h3>
                <p className="text-sm">
                  {carouselData[currentIndex].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
