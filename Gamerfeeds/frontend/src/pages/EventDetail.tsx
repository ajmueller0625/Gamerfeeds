import { useParams, useNavigate } from "react-router-dom";
import useEventStore from "../store/eventStore";
import { useEffect, useState } from "react";
import {
  Facebook,
  Instagram,
  Link,
  Twitch,
  Twitter,
  Youtube,
  Globe,
} from "lucide-react";

export default function EventDetail() {
  const { eventID } = useParams<{ eventID: string }>();
  const { event, isEventLoading, eventError, fetchEventByID } = useEventStore();
  const navigate = useNavigate();
  const [dataChecked, setDataChecked] = useState(false);

  useEffect(() => {
    // Check if the ID is a valid number
    const numericID = Number(eventID);

    if (isNaN(numericID)) {
      // If ID is not a valid number, redirect immediately to 404
      navigate("/not-found", { replace: true });
      return;
    }

    fetchEventByID(numericID);
  }, [fetchEventByID, eventID, navigate]);

  useEffect(() => {
    if (!isEventLoading && !event && !dataChecked) {
      setDataChecked(true);
      // Add a small delay to ensure all state updates are complete
      const timer = setTimeout(() => {
        navigate("/not-found", { replace: true });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isEventLoading, event, navigate, dataChecked]);

  // Function to convert regular URLs to embed URLs
  const getEmbedUrl = (url: string): string => {
    if (!url) return "";

    // Handle YouTube URLs
    if (url.includes("youtube.com/watch")) {
      // Extract video ID from YouTube URL
      const videoId = new URL(url).searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Handle YouTube short URLs
    if (url.includes("youtu.be")) {
      // Extract video ID from short URL
      const videoId = url.split("/").pop();
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Handle Twitch URLs
    if (url.includes("twitch.tv")) {
      // Check if it's a clip, video, or channel
      if (url.includes("/clip/")) {
        const clipId = url.split("/clip/").pop();
        return `https://clips.twitch.tv/embed?clip=${clipId}`;
      } else if (url.includes("/videos/")) {
        const videoId = url.split("/videos/").pop();
        return `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}`;
      } else {
        // Assume it's a channel
        const channel = url.split("twitch.tv/").pop();
        return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
      }
    }

    // Return original URL if no conversion is needed or possible
    return url;
  };

  // Function to render appropriate icon based on URL
  const renderUrlIcon = (url: string) => {
    if (!url) return <Globe size={20} />;

    const lowerUrl = url.toLowerCase();

    if (
      lowerUrl.includes("twitch.tv") ||
      lowerUrl.includes("clips.twitch.tv")
    ) {
      return <Twitch size={20} color="#6441a5" />;
    } else if (
      lowerUrl.includes("youtube.com") ||
      lowerUrl.includes("youtu.be")
    ) {
      return <Youtube size={20} color="#ff0000" />;
    } else if (
      lowerUrl.includes("facebook.com") ||
      lowerUrl.includes("fb.com")
    ) {
      return <Facebook size={20} color="#1877f2" />;
    } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
      return <Twitter size={20} color="#1da1f2" />;
    } else if (lowerUrl.includes("instagram.com")) {
      return <Instagram size={20} color="#e4405f" />;
    } else {
      return <Link size={20} />;
    }
  };

  if (isEventLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 spinner-color"></div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {eventError}</div>
    );
  }

  if (!event && !isEventLoading) {
    // We'll handle redirection in the useEffect above
    return null;
  }

  // Format the date with time in local timezone
  const formattedDateTime = (time: Date) =>
    time.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });

  return (
    <div className="max-w-7xl mx-auto px-4 mt-25 z-10">
      <h1 className="font-[Black_Ops_One] div-header text-3xl mb-4">
        Event Details
      </h1>
      <div className="rounded-lg card-background">
        <h1 className="text-2xl font-semibold p-3 text-center">
          {event?.name}
        </h1>
      </div>
      <div className="grid grid-cols-7 row-span-5 gap-3 mt-4 mb-10">
        {/* Video/Image section */}
        {event?.live_stream_url ? (
          <div className="col-span-5 row-span-full">
            <iframe
              src={getEmbedUrl(event.live_stream_url)}
              className="w-full h-139 min-h-64 object-contain rounded-lg"
              title="Live Stream"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="col-span-5 h-139">
            <img
              src={event?.logo_url}
              alt={`Event ${event?.id} logo`}
              className="rounded-lg w-full h-full"
            />
          </div>
        )}

        {/* Right column content in a flex container */}
        <div className="col-span-2 flex flex-col gap-3">
          {/* Logo section (when live stream is available) */}
          {event?.live_stream_url && (
            <div className="p-3 card-background rounded-lg">
              <img
                src={event?.logo_url}
                alt={`Event ${event?.id} logo`}
                className="rounded-lg w-full h-full object-contain"
              />
            </div>
          )}

          {/* Description section */}
          <div className="p-3 card-background rounded-lg">
            <h3 className="text-base font-semibold">Description</h3>
            {event?.description ? (
              <p className="text-sm p-1">{event.description}</p>
            ) : (
              <p className="text-sm p-1">No description available!</p>
            )}
          </div>

          {/* Time sections in a single row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-background rounded-lg p-3">
              <h3 className="text-base font-semibold">Start Time</h3>
              <p className="p-1 text-sm">
                {event?.start_time
                  ? formattedDateTime(new Date(event.start_time))
                  : "Not specified"}
              </p>
            </div>
            <div className="card-background rounded-lg p-3">
              <h3 className="text-base font-semibold">End Time</h3>
              <p className="p-1 text-sm">
                {event?.end_time
                  ? formattedDateTime(new Date(event.end_time))
                  : "Not specified"}
              </p>
            </div>
          </div>

          {/* URLs section */}
          {event?.event_urls && event.event_urls.length > 0 && (
            <div className="rounded-lg card-background p-3">
              <div className="flex flex-wrap gap-2">
                {event.event_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 filter-button rounded-full"
                    title={url}
                  >
                    {renderUrlIcon(url)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
