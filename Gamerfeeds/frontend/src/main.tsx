import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { StrictMode } from "react";
import "./index.css";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import News from "./pages/News";
import TopGames from "./pages/TopGames";
import LatestGames from "./pages/LatestGames";
import UpcomingGames from "./pages/UpcomingGames";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "/news",
        element: <News />,
      },
      {
        path: "/topgames",
        element: <TopGames />,
      },
      {
        path: "/latestgames",
        element: <LatestGames />,
      },
      {
        path: "/upcominggames",
        element: <UpcomingGames />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
