import { useCallback, useEffect, useRef, useState } from "react";
import useNewsStore from "../store/newsStore";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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
      description: item.description || "",
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
              <Link to="">
                <div
                  className="font-[Hubot_Sans] absolute start-0 bottom-0 w-full px-10 py-5
                 bg-neutral-900/50 hover:bg-neutral-800/50 text-white"
                >
                  <h3 className="text-xl font-bold underline">
                    {carouselData[currentIndex].title}
                  </h3>
                  <p className="text-sm">
                    {carouselData[currentIndex].description}
                  </p>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
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
          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {carouselData.map((_, index) => (
              <button
                key={index}
                onClick={() => changeImage(index)}
                className={`h-2 w-2 rounded-full transition-all duration-300 cursor-pointer 
                  ${
                    currentIndex === index
                      ? "bg-neutral-500/50 scale-125"
                      : "bg-neutral-300/50"
                  }`}
              />
            ))}
          </div>
        </div>
        {cardData.map((card) => (
          <Link to="">
            <div
              key={card.id}
              className="rounded-md relative h-49 border-2 hover:cursor-pointer hover:border-0 
              border-transparent text-white"
            >
              <img
                src={card.image_url}
                alt={`Card Image ${card.id}`}
                className="object-cover w-full h-full rounded-lg"
              />
              <div
                className="absolute bottom-0 left-0 w-full px-3 py-2 bg-neutral-900/60 
               font-[Hubot_Sans] rounded-b-lg"
              >
                <h3 className="text-xs font-bold">{card.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
