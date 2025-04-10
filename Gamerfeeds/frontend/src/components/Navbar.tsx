import {
  ChevronDown,
  ChevronUp,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
  LogOut,
  LogIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";
import useSearchStore from "../store/searchStore";
import useAuthStore from "../store/authStore";
import logo from "../assets/logo.png";
import SearchDropdown from "./SearchDropdown";

export default function Navbar() {
  const [isGameDropdownActive, setGameDropdownState] = useState(false);
  const [isUserDropdownActive, setUserDropdownState] = useState(false);
  const [isSearchDropdownVisible, setSearchDropdownVisible] = useState(false);
  const [searchTimer, setSearchTimer] = useState<number | null>(null);
  const location = useLocation();
  const isSearchPage = location.pathname === "/search";

  const { isDarkMode, toggleTheme } = useThemeStore();
  const { token, userData, logout } = useAuthStore();
  const {
    query,
    setQuery,
    setDebouncedQuery,
    searchContent,
    clearSearch,
    quickSearch,
    quickResults,
    isQuickSearching,
    quickSearchError,
    clearQuickSearch,
  } = useSearchStore();

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  // Use this ref to track if a navigation is in progress
  const isNavigating = useRef(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Reset navigation flag when location changes
  useEffect(() => {
    isNavigating.current = false;
  }, [location]);

  // Effect for real-time search with debouncing
  useEffect(() => {
    // Clear previous timer
    if (searchTimer !== null) {
      window.clearTimeout(searchTimer);
    }

    // Only proceed if we're not navigating
    if (isNavigating.current) {
      return;
    }

    if (query.trim().length >= 2) {
      // Show dropdown only when not on search page
      if (!isSearchPage && document.activeElement === searchInputRef.current) {
        setSearchDropdownVisible(true);
        // Quick search for dropdown
        quickSearch(query);
      }

      // Debounced query update for search page
      const timer = window.setTimeout(() => {
        setDebouncedQuery(query);

        // If on search page, update URL and trigger search
        if (isSearchPage) {
          const searchParams = new URLSearchParams(location.search);
          searchParams.set("q", query);
          searchParams.set("page", "1");
          navigate(`${location.pathname}?${searchParams.toString()}`, {
            replace: true,
          });
          searchContent(1, 15);
        }
      }, 300);

      setSearchTimer(timer);
    } else {
      clearQuickSearch();
      setSearchDropdownVisible(false);

      // Clear search results if query is empty
      if (query.trim() === "") {
        setDebouncedQuery("");
        if (isSearchPage) {
          clearSearch();
        }
      }
    }

    // Cleanup timer on unmount
    return () => {
      if (searchTimer !== null) {
        window.clearTimeout(searchTimer);
      }
    };
  }, [query, isSearchPage]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close while navigating
      if (isNavigating.current) {
        return;
      }

      // Close search dropdown if clicking outside search area
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchDropdownVisible(false);
      }

      // Close user dropdown if clicking outside user menu area
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownState(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setDebouncedQuery(query);
      isNavigating.current = true;

      // Get current search parameters to preserve the current type
      const searchParams = new URLSearchParams(location.search);
      const currentType = searchParams.get("type") || "games";

      // Navigate with the current search type preserved
      navigate(
        `/search?q=${encodeURIComponent(query)}&type=${currentType}&page=1`
      );
      setSearchDropdownVisible(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    clearSearch();
    clearQuickSearch();
    setSearchDropdownVisible(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // This function will be passed to the SearchDropdown component
  const handleLinkClick = () => {
    // Set navigating flag to prevent dropdown state changes during navigation
    isNavigating.current = true;
    setSearchDropdownVisible(false);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownState(false);
    navigate("/");
  };

  return (
    <header className="w-screen fixed top-0 z-50">
      <nav className="flex items-center justify-between max-w-7xl mx-auto py-4 space-x-15">
        <div className="flex items-center space-x-5 font-semibold">
          <Link to="/">
            <img src={logo} alt="Site Logo" className="h-10" />
          </Link>
          <div className="relative" ref={searchRef}>
            <div className="flex items-center relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search games or news..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (
                    query.trim().length >= 2 &&
                    !isSearchPage &&
                    !isNavigating.current
                  ) {
                    setSearchDropdownVisible(true);
                  }
                }}
                className="px-3 py-2 pl-4 pr-10 rounded-lg bg-white text-black focus:outline-none min-w-[250px]"
              />
              {query ? (
                <X
                  className="absolute text-neutral-600 right-10 top-1/2 transform -translate-y-1/2 cursor-pointer h-4 w-4"
                  onClick={handleClearSearch}
                />
              ) : null}
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Search className="text-neutral-600" />
              </button>
            </div>

            {/* Real-time search dropdown - only show when not on search page */}
            {isSearchDropdownVisible &&
              query.trim().length >= 2 &&
              !isSearchPage &&
              !isNavigating.current && (
                <SearchDropdown
                  results={quickResults}
                  isLoading={isQuickSearching}
                  error={quickSearchError}
                  onLinkClick={handleLinkClick}
                />
              )}
          </div>
        </div>
        <nav>
          <ul className="font-[Black_Ops_One] flex">
            <Link to="/">
              <li className="py-2 px-4 rounded-lg nav-hover-color">Home</li>
            </Link>
            <Link to="/news">
              <li className="py-2 px-4 rounded-lg nav-hover-color">News</li>
            </Link>
            <li
              className={
                isGameDropdownActive ? "nav-hover-color rounded-t-lg" : ""
              }
              onMouseEnter={() => setGameDropdownState(true)}
              onMouseLeave={() => setGameDropdownState(false)}
            >
              <button className="flex py-2 px-6 items-center hover:cursor-pointer">
                Games
                {isGameDropdownActive ? (
                  <ChevronUp className="ml-1 w-4 h-4" />
                ) : (
                  <ChevronDown className="ml-1 w-4 h-4" />
                )}
              </button>
              {isGameDropdownActive && (
                <ul className="absolute rounded-b-lg rounded-tr-lg nav-ul-background">
                  <Link to="/topgames">
                    <li className="p-4 nav-li-background rounded-tr-lg">
                      Top Games
                    </li>
                  </Link>
                  <Link to="/latestgames">
                    <li className="p-4 nav-li-background">Latest Games</li>
                  </Link>
                  <Link to="/upcominggames">
                    <li className="p-4 nav-li-background rounded-b-lg">
                      Upcoming Games
                    </li>
                  </Link>
                </ul>
              )}
            </li>
            <Link to="/events">
              <li className="py-2 px-6 rounded-lg nav-hover-color">Events</li>
            </Link>
            <Link to="">
              <li className="py-2 px-6 rounded-lg nav-hover-color">
                Discussion
              </li>
            </Link>
          </ul>
        </nav>
        <nav className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300 focus:outline-none"
            aria-pressed={isDarkMode}
          >
            <span className="sr-only">Toggle dark mode</span>
            <div
              className={`
                  ${isDarkMode ? "bg-neutral-700" : "bg-cyan-400"} 
                  inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300
                `}
            >
              <div
                className={`
                    ${isDarkMode ? "translate-x-5" : "translate-x-0"} 
                    flex items-center justify-center h-5 w-5 transform rounded-full bg-white transition-transform duration-300 hover:cursor-pointer
                  `}
              >
                {isDarkMode ? (
                  <Moon size={14} className="text-neutral-700" />
                ) : (
                  <Sun size={14} className="text-yellow-700" />
                )}
              </div>
            </div>
          </button>

          {token ? (
            <li
              ref={userDropdownRef}
              className={
                isUserDropdownActive
                  ? "menu-ul-background rounded-t-lg list-none relative"
                  : "list-none relative"
              }
              onMouseEnter={() => setUserDropdownState(true)}
              onMouseLeave={() => setUserDropdownState(false)}
            >
              <button className="flex py-2 px-4 rounded-lg nav-ul-background hover:cursor-pointer items-center font-[Black_Ops_One] text-sm">
                <Menu size={18} />
                {isUserDropdownActive ? (
                  <ChevronUp className="ml-1 w-4 h-4" />
                ) : (
                  <ChevronDown className="ml-1 w-4 h-4" />
                )}
              </button>
              {isUserDropdownActive && (
                <ul className="absolute right-0 rounded-tl-lg rounded-b-lg menu-ul-background min-w-[180px] shadow-lg z-50">
                  <div className="p-3 text-sm">
                    Signed in as
                    <br />
                    <span className="font-semibold">
                      {userData?.username || userData?.email}
                    </span>
                  </div>
                  <Link to="/me/profile">
                    <li className="p-3 flex items-center">
                      <User size={16} className="mr-2" />
                      Profile
                    </li>
                  </Link>
                  <li
                    className="p-3 rounded-b-lg flex items-center hover:cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </li>
                </ul>
              )}
            </li>
          ) : (
            <Link to="/login">
              <button className="flex gap-1 items-center font-bold text-sm py-2 px-4 rounded-lg custom-button hover:cursor-pointer">
                <LogIn size={16} />
                Login
              </button>
            </Link>
          )}
        </nav>
      </nav>
    </header>
  );
}
