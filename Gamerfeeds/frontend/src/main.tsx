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
import NewsArticle from "./pages/NewsArticle";
import GameDetail from "./pages/GameDetail";
import Event from "./pages/Event";
import EventDetail from "./pages/EventDetail";
import SearchResults from "./pages/SearchResult";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Register from "./pages/Register";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import Discussion from "./pages/Discussion";
import DiscussionDetail from "./pages/DiscussionDetail";
import NewDiscussion from "./pages/NewDiscussion";
import EditDiscussion from "./pages/EditDiscussion";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter(
  [
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
        {
          path: "/news/:newsID",
          element: <NewsArticle />,
        },
        {
          path: "/games/:gameID",
          element: <GameDetail />,
        },
        {
          path: "/events",
          element: <Event />,
        },
        {
          path: "/events/:eventID",
          element: <EventDetail />,
        },
        {
          path: "/search",
          element: <SearchResults />,
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/me/profile",
          element: <Profile />,
        },
        {
          path: "/me/change-password",
          element: <ChangePassword />,
        },
        {
          path: "/login/register",
          element: <Register />,
        },
        {
          path: "/login/forget-password",
          element: <ForgetPassword />,
        },
        {
          path: "/reset-password",
          element: <ResetPassword />,
        },
        {
          path: "/discussion",
          element: <Discussion />,
        },
        {
          path: "/discussion/:discussionId",
          element: <DiscussionDetail />,
        },
        {
          path: "/discussion/new",
          element: <NewDiscussion />,
        },
        {
          path: "/discussion/edit/:discussionId",
          element: <EditDiscussion />,
        },
        {
          path: "/aboutus",
          element: <AboutUs />,
        },
        {
          path: "/contactus",
          element: <ContactUs />,
        },
        {
          path: "/not-found",
          element: <NotFound />,
        },
        {
          path: "*",
          element: <NotFound />,
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
