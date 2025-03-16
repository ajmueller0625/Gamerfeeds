import { useEffect, useState } from "react";
import NewsCarousel from "../components/NewsCarousel";
import useNewsStore from "../store/newsStore";
import { Link } from "react-router-dom";
import NewsCard from "../components/NewsCard";

interface CarouselData {
  id: number;
  image_url: string;
  title: string;
  description: string;
}

interface CardData {
  id: number;
  image_url: string;
  title: string;
}

export default function Home() {
  const { news, isLoading, error, fetchLatestNews } = useNewsStore();
  const [carouselData, setCarouselData] = useState<CarouselData[]>([]);
  const [cardData, setCardData] = useState<CardData[]>([]);

  const CAROUSEL_ITEM_COUNT = 10;

  useEffect(() => {
    fetchLatestNews(CAROUSEL_ITEM_COUNT);
  }, [fetchLatestNews, CAROUSEL_ITEM_COUNT]);

  useEffect(() => {
    if (news.length > 0) {
      const FilteredCarouselData = news
        .filter((item) => item && item.id && item.title && item.image_url)
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          image_url: item.image_url,
          title: item.title,
          description: item.description || "",
        }));

      setCarouselData(FilteredCarouselData);

      const FilteredCardData = news
        .filter((item) => item && item.id && item.title && item.image_url)
        .slice(5, 11)
        .map((item) => ({
          id: item.id,
          image_url: item.image_url,
          title: item.title,
        }));

      setCardData(FilteredCardData);
    }
  }, [news]);

  if (isLoading) {
    return <div className="text-white text-center p-5">Loading news...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-5">Error: {error}</div>;
  }

  if (news.length === 0) {
    return <div className="text-white text-center p-5">No news available</div>;
  }

  return (
    <div className="flex-col items-center justify-center mt-25 z-10 mx-auto max-w-5xl">
      <h1 className="font-[Black_Ops_One] text-3xl div-header pb-1 mb-5">
        Latest News
      </h1>
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
        <div className="col-span-2 row-span-2">
          <NewsCarousel carouseldata={carouselData} />
        </div>
        {cardData.map((card) => (
          <Link to="">
            <div key={card.id} className="col-span-1 row-span-1">
              <NewsCard
                id={card.id}
                image_url={card.image_url}
                title={card.title}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
