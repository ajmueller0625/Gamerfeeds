import { useEffect } from "react";

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-auto flex flex-col mt-25 z-10 max-w-7xl mb-10">
      <h1 className="div-header font-[Black_Ops_One] text-3xl mb-10">
        About Us
      </h1>
      <div className="max-w-3xl p-10 card-background rounded-lg mx-auto flex flex-col gap-4">
        <h1 className="font-bold text-2xl">Welcome to our web app!</h1>
        <p>
          This web application is a school project developed for Nackademin,
          Stockholm. Our goal is to create a vibrant platform for gamers where
          you can explore the latest in the gaming world.
        </p>
        <p>Here’s what you’ll find:</p>
        <ul className="list-disc flex flex-col gap-3">
          <li className="ml-10">
            <p>
              <span className="font-bold">Gaming News: </span>Stay updated with
              the latest gaming news, carefully cleaned and curated using
              NewsAPI and OpenAI.
            </p>
          </li>
          <li className="ml-10">
            <p>
              <span className="font-bold">
                Top, Latest, and Upcoming Games:{" "}
              </span>
              Discover what's hot right now and what’s coming soon,
              <span className="font-bold">
                {" "}
                powered by the IGDB Twitch API.
              </span>
            </p>
          </li>
          <li className="ml-10">
            <p>
              <span className="font-bold">Events & Livestreams: </span>Check out
              current and upcoming gaming events — and if a livestream is
              available, you can watch it directly through our platform.
            </p>
          </li>
          <li className="ml-10">
            <span className="font-bold">Community Interaction: </span>
            <span> If you create an account and log in, you can:</span>
            <ul className="list-disc flex flex-col gap-3">
              <li className="ml-10 mt-2">
                <p>Comment on news articles and games.</p>
              </li>
              <li className="ml-10">
                <p>
                  Start discussions and share your thoughts with other users.
                </p>
              </li>
            </ul>
          </li>
        </ul>
        <h1 className="font-bold text-2xl">Technology Behind the Project</h1>
        <ul className="list-disc flex flex-col gap-3">
          <li className="ml-10">
            <p>
              <span className="font-bold">Frontend: </span>Built with Vite,
              TypeScript, and Tailwind CSS for a fast, modern, and responsive
              experience.
            </p>
          </li>
          <li className="ml-10">
            <p>
              <span className="font-bold">Backend: </span>Powered by Python and
              FastAPI for reliable and efficient data handling.
            </p>
          </li>
        </ul>
        <p>
          This project combines our passion for gaming with cutting-edge tech,
          all while providing a great user experience. We hope you enjoy
          exploring it as much as we enjoyed building it!
        </p>
      </div>
    </div>
  );
}
