import { useEffect } from "react";
import useNewsStore from "../store/newsStore";
import { useParams } from "react-router-dom";

export default function NewsArticle() {
  const { newsID } = useParams<{ newsID: string }>();
  const { news, isNewsLoading, newsError, fetchNewsByID } = useNewsStore();

  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  useEffect(() => {
    fetchNewsByID(Number(newsID));
  }, [fetchNewsByID]);

  if (isNewsLoading) {
    return <div className="text-white text-center p-5">Loading...</div>;
  }

  if (newsError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {newsError}</div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-white text-center p-5">
        No news found with ID: {newsID}
      </div>
    );
  }

  const newsData = news[0];

  return (
    <div className="mt-25 z-10 mx-auto max-w-7xl ">
      <h1 className="text-3xl font-[Black_Ops_One] div-header mb-5">
        News Article
      </h1>
      <div className="font-[Hubot_Sans] flex flex-col gap-5 p-5 mb-10 max-w-6xl mx-auto">
        <div className="p-5 rounded-lg card-background space-y-2">
          <h2 className="text-3xl font-bold text-center">{newsData.title}</h2>
          {newsData.description && (
            <article className="text-2xl/relaxed text-center">
              {newsData.description}
            </article>
          )}
        </div>
        <div className="p-5 rounded-lg card-background space-y-2">
          <img
            src={newsData.image_url}
            alt={`${newsData.title} Image`}
            className="rounded-lg w-full h-full"
          />
          <div className="flex justify-between text-lg">
            <h3>
              <span className="font-semibold">Author: </span>
              {newsData.author}
            </h3>
            <h3>
              <span className="font-semibold">Published: </span>{" "}
              {formatDate(new Date(newsData.published))}
            </h3>
          </div>
        </div>
        <div className="p-5 rounded-lg card-background space-y-2">
          <article className="text-xl/relaxed tracking-wide">
            {newsData.content}
          </article>
          <h3 className="text-lg">
            <span className="font-semibold">Read more: </span>
            <a
              href={newsData.source_url}
              target="_blank"
              className="hover:underline"
            >
              {newsData.source_name}
            </a>
          </h3>
        </div>
      </div>
    </div>
  );
}
