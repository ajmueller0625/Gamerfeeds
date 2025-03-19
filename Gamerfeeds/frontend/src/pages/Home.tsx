import { useEffect, useState } from "react";
import NewsCarousel from "../components/NewsCarousel";
import useNewsStore from "../store/newsStore";
import { Link } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import useGameStore from "../store/gameStore";
import GameCard from "../components/GameCard";

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

interface GameCardData {
  id: number;
  name: string;
  cover_image_url: string;
  release_date: Date;
  rating: number | null;
}

export default function Home() {
  const {
    news,
    isNewsLoading,
    newsError,
    fetchLatestNews,
    fetchNewsFromRandomSources,
  } = useNewsStore();

  const {
    topGames,
    latestGames,
    isTopGamesLoading,
    isLatestGamesLoading,
    topGamesError,
    latestGamesError,
    fetchTopGames,
    fetchLatestGames,
  } = useGameStore();

  const [carouselData, setCarouselData] = useState<CarouselData[]>([]);
  const [cardData, setCardData] = useState<CardData[]>([]);
  const [topGamesData, setTopGamesData] = useState<GameCardData[]>([]);
  const [latestGamesData, setLatestGamesData] = useState<GameCardData[]>([]);

  // State for the two random sources
  const [firstSourceNews, setFirstSourceNews] = useState<CardData[]>([]);
  const [secondSourceNews, setSecondSourceNews] = useState<CardData[]>([]);
  const [firstSourceName, setFirstSourceName] = useState<string>("Latest");
  const [secondSourceName, setSecondSourceName] = useState<string>("Latest");

  const CAROUSEL_ITEM_COUNT = 10;
  const GAME_ITEM_COUNT = 9;
  const SIDE_NEWS_COUNT = 5;

  // Fetch main news data
  useEffect(() => {
    fetchLatestNews(CAROUSEL_ITEM_COUNT);
  }, [fetchLatestNews]);

  // Fetch random source news for the two side panels
  useEffect(() => {
    const fetchRandomSourceNews = async () => {
      try {
        // Fetch news from two random sources
        const randomNewsData = await fetchNewsFromRandomSources(
          SIDE_NEWS_COUNT
        );

        // Process first source news
        if (randomNewsData.firstSource.data.length > 0) {
          const formattedFirstSourceNews = randomNewsData.firstSource.data.map(
            (item) => ({
              id: item.id,
              image_url: item.image_url,
              title: item.title,
            })
          );
          setFirstSourceNews(formattedFirstSourceNews);
          setFirstSourceName(randomNewsData.firstSource.name);
        }

        // Process second source news
        if (randomNewsData.secondSource.data.length > 0) {
          const formattedSecondSourceNews =
            randomNewsData.secondSource.data.map((item) => ({
              id: item.id,
              image_url: item.image_url,
              title: item.title,
            }));
          setSecondSourceNews(formattedSecondSourceNews);
          setSecondSourceName(randomNewsData.secondSource.name);
        }
      } catch (error) {
        console.error("Error fetching random source news:", error);
      }
    };

    fetchRandomSourceNews();
  }, [fetchNewsFromRandomSources]);

  // Process main news data when it changes
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

  // Fetch top games
  useEffect(() => {
    fetchTopGames(GAME_ITEM_COUNT);
  }, [fetchTopGames]);

  // Process top games when they change
  useEffect(() => {
    if (topGames.length > 0) {
      const FilteredTopGamesData = topGames
        .filter(
          (item) =>
            item &&
            item.id &&
            item.name &&
            item.cover_image_url &&
            item.release_date
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          cover_image_url: item.cover_image_url,
          release_date: new Date(item.release_date),
          rating: item.rating,
        }));

      setTopGamesData(FilteredTopGamesData);
    }
  }, [topGames]);

  // Fetch latest games
  useEffect(() => {
    fetchLatestGames(GAME_ITEM_COUNT);
  }, [fetchLatestGames]);

  // Process latest games when they change
  useEffect(() => {
    if (latestGames.length > 0) {
      const FilteredLatestGamesData = latestGames
        .filter(
          (item) =>
            item &&
            item.id &&
            item.name &&
            item.cover_image_url &&
            item.release_date
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          cover_image_url: item.cover_image_url,
          release_date: new Date(item.release_date),
          rating: item.rating,
        }));

      setLatestGamesData(FilteredLatestGamesData);
    }
  }, [latestGames]);

  // Show loading state
  const isLoading = isNewsLoading || isTopGamesLoading || isLatestGamesLoading;
  if (isLoading) {
    return <div className="text-white text-center p-5">Loading...</div>;
  }

  // Show error states
  if (newsError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {newsError}</div>
    );
  }

  if (topGamesError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {topGamesError}</div>
    );
  }

  if (latestGamesError) {
    return (
      <div className="text-red-500 text-center p-5">
        Error: {latestGamesError}
      </div>
    );
  }

  // Show empty state for news
  if (news.length === 0) {
    return <div className="text-white text-center p-5">No news available</div>;
  }

  return (
    <div className="flex-col items-center justify-center mt-25 z-10 mx-auto max-w-6xl">
      {/* News Section */}
      <h1 className="font-[Black_Ops_One] text-3xl div-header pb-1 mb-5">
        Latest News
      </h1>
      <div className="grid grid-cols-3 grid-rows-3 gap-4">
        <div className="col-span-2 row-span-2">
          <NewsCarousel carouseldata={carouselData} />
        </div>
        {cardData.map((card) => (
          <div className="col-span-1 row-span-1" key={card.id}>
            <Link to="" key={card.id}>
              <NewsCard
                id={card.id}
                image_url={card.image_url}
                title={card.title}
              />
            </Link>
          </div>
        ))}
      </div>

      {/* Top Games and First Source News Section */}
      <div className="flex flex-row justify-between">
        <div>
          <h1 className="font-[Black_Ops_One] text-3xl div-header pb-1 mt-10 mb-5">
            Top Games
          </h1>
          <div className="grid grid-cols-3 grid-rows-3 gap-5 mb-5">
            {topGamesData.length > 0 ? (
              topGamesData.map((game) => (
                <div className="col-span-1 row-span-1" key={game.id}>
                  <Link to="" key={game.id}>
                    <GameCard
                      name={game.name}
                      cover_image_url={game.cover_image_url}
                      release_date={game.release_date}
                      rating={game.rating}
                    />
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-white text-center p-5">
                No top games available
              </div>
            )}
          </div>
        </div>
        <div>
          <h1 className="font-[Black_Ops_One] text-2xl div-header pb-1 mt-11 mb-5">
            {firstSourceName} Latest
          </h1>
          <div className="flex flex-col gap-5">
            {firstSourceNews.length > 0 ? (
              firstSourceNews.map((news) => (
                <div key={news.id} className="w-90 h-50">
                  <Link to="" key={news.id}>
                    <NewsCard
                      id={news.id}
                      image_url={news.image_url}
                      title={news.title}
                    />
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-white text-center p-5">
                No news available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Latest Games and Second Source News Section */}
      <div className="flex flex-row mb-10 justify-between">
        <div>
          <h1 className="font-[Black_Ops_One] text-3xl div-header mt-5 pb-1 mb-5">
            Latest Games
          </h1>
          <div className="grid grid-cols-3 grid-rows-3 gap-5">
            {latestGamesData.length > 0 ? (
              latestGamesData.map((game) => (
                <div className="col-span-1 row-span-1" key={game.id}>
                  <Link to="" key={game.id}>
                    <GameCard
                      name={game.name}
                      cover_image_url={game.cover_image_url}
                      release_date={game.release_date}
                      rating={game.rating}
                    />
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-white text-center p-5">
                No latest games available
              </div>
            )}
          </div>
        </div>
        <div>
          <h1 className="font-[Black_Ops_One] text-2xl div-header pb-1 mt-6 mb-5">
            {secondSourceName} Latest
          </h1>
          <div className="flex flex-col gap-5">
            {secondSourceNews.length > 0 ? (
              secondSourceNews.map((news) => (
                <div key={news.id} className="w-90 h-50">
                  <Link to="" key={news.id}>
                    <NewsCard
                      id={news.id}
                      image_url={news.image_url}
                      title={news.title}
                    />
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-white text-center p-5">
                No news available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
