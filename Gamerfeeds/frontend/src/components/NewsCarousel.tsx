import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CarouselData {
  id: number;
  image_url: string;
  title: string;
  description: string;
}

interface CarouselProps {
  carouseldata: CarouselData[];
}

export default function NewsCarousel({ carouseldata }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<number | null>(null);

  const hasData = carouseldata && carouseldata.length > 0;

  const nextImage = useCallback(() => {
    if (hasData) {
      setDirection(1);
      setCurrentIndex((nextIndex) => (nextIndex + 1) % carouseldata.length);
    }
  }, [carouseldata, hasData]);

  const resetInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (hasData) {
      intervalRef.current = window.setInterval(nextImage, 5000);
    }
  }, [nextImage, hasData]);

  const prevImage = useCallback(() => {
    if (hasData) {
      setDirection(-1);
      setCurrentIndex(
        (prevIndex) =>
          (prevIndex - 1 + carouseldata.length) % carouseldata.length
      );
    }
  }, [carouseldata, hasData]);

  const handleNextImage = () => {
    nextImage();
    resetInterval();
  };

  const handlePrevImage = () => {
    prevImage();
    resetInterval();
  };

  const changeImage = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    resetInterval();
  };

  useEffect(() => {
    if (hasData) {
      resetInterval();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [carouseldata, resetInterval, hasData]);

  useEffect(() => {
    if (hasData) {
      setCurrentIndex(0);
    }
  }, [carouseldata, hasData]);

  if (!hasData) {
    return (
      <div className="relative overflow-hidden rounded-lg w-full h-100 bg-neutral-800 flex items-center justify-center">
        <p className="text-white">Loading carousel...</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg w-full h-105">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={carouseldata[currentIndex]?.id || "placeholder"}
          className="absolute w-full h-full object-cover flex items-center justify-center"
          initial={{ x: direction * 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -direction * 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <img
            src={carouseldata[currentIndex].image_url}
            alt={`Slide: ${carouseldata[currentIndex].title}`}
            className="absolute w-full h-full object-cover"
          />
          <Link to="">
            <div
              className="font-[Hubot_Sans] absolute start-0 bottom-0 w-full px-10 pt-5 pb-10
                 bg-neutral-900/50 hover:bg-neutral-800/50 text-white"
            >
              <h3 className="text-xl font-bold underline">
                {carouseldata[currentIndex].title}
              </h3>
              <p className="text-sm">
                {carouseldata[currentIndex].description}
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
        {carouseldata.map((_, index) => (
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
  );
}
