import { useEffect, useState } from "react";
import useNewsStore from "../store/newsStore";
import { useNavigate, useParams } from "react-router-dom";
import CommentsSection from "../components/CommentsSection";

export default function NewsArticle() {
  const { newsID } = useParams<{ newsID: string }>();
  const { news, isNewsLoading, newsError, fetchNewsByID } = useNewsStore();

  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const navigate = useNavigate();
  const [dataChecked, setDataChecked] = useState(false);

  useEffect(() => {
    // Check if the ID is a valid number
    const numericID = Number(newsID);

    if (isNaN(numericID)) {
      // If ID is not a valid number, redirect immediately to 404
      navigate("/not-found", { replace: true });
      return;
    }

    fetchNewsByID(numericID);
  }, [fetchNewsByID, newsID, navigate]);

  useEffect(() => {
    if (!isNewsLoading && news.length === 0 && !dataChecked) {
      setDataChecked(true);
      // Add a small delay to ensure all state updates are complete
      const timer = setTimeout(() => {
        navigate("/not-found", { replace: true });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isNewsLoading, news, navigate, dataChecked]);

  if (isNewsLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 spinner-color"></div>
      </div>
    );
  }

  if (newsError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {newsError}</div>
    );
  }

  if (news.length === 0 && !isNewsLoading) {
    // We'll handle redirection in the useEffect above
    return null;
  }

  const newsData = news[0];

  return (
    <div className="mt-25 z-10 mx-auto max-w-7xl ">
      <h1 className="text-3xl font-[Black_Ops_One] div-header mb-5">
        News Article
      </h1>
      <div className="flex flex-col gap-5 p-5 mb-10 max-w-6xl mx-auto">
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

        {/* Comments Section*/}
        <div className="p-5">
          <CommentsSection contentType="news" contentId={Number(newsID)} />
        </div>
      </div>
    </div>
  );
}
