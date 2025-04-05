import { useEffect, useState } from "react";
import useEventStore from "../store/eventStore";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import EventCard from "../components/EventCard";
import Pagination from "../components/Pagination";

export default function Event() {
  const { events, pagination, isEventLoading, eventError, fetchEvents } =
    useEventStore();

  // Use URL search params to store pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize state from URL search params
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) : 1;
  });

  const itemsPerPage = 9;

  // Update URL when pagination changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    // Update URL without causing a navigation/reload
    setSearchParams(params);
  }, [currentPage, setSearchParams]);

  useEffect(() => {
    fetchEvents(currentPage, itemsPerPage);
  }, [fetchEvents, currentPage, itemsPerPage]);

  const handlePageChange = (pageNumber: number) => {
    const validPage = Math.max(
      1,
      Math.min(pageNumber, pagination?.total_pages || 1)
    );
    setCurrentPage(validPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to first page
  const resetPage = () => {
    setCurrentPage(1);
    navigate("/events");
  };

  if (isEventLoading) {
    return <div className="text-white text-center p-5">Loading...</div>;
  }

  if (eventError) {
    return (
      <div className="text-red-500 text-center p-5">Error: {eventError}</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-25 z-10 flex flex-col gap-5 mb-10">
      <h1 className="text-3xl font-[Black_Ops_One] div-header">Events</h1>

      {events.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-5 max-w-6xl mx-auto">
            {events.map((event) => (
              <Link to={`/events/${event.id}`} key={event.id}>
                <div className="h-55">
                  <EventCard
                    id={event.id}
                    name={event.name}
                    logo_url={event.logo_url}
                  />
                </div>
              </Link>
            ))}
          </div>

          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </>
      ) : (
        <div className="card-background flex flex-col rounded-lg justify-center items-center font-[Hubot_Sans] px-5 py-8 mx-30">
          <p className="font-bold text-xl">No events found!</p>
          <p className="text-lg">There are no current or upcoming events!</p>
          <Link to="/">
            <button
              onClick={resetPage}
              className="mt-2 px-6 py-2 filter-button rounded-md hover:cursor-pointer"
            >
              Back to Home
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
