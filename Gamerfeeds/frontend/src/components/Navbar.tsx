import { ChevronDown, ChevronUp, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";

export default function Navbar() {
  const [isGameDropdownActive, setGameDropdownState] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <header className="w-screen fixed top-0 z-50">
      <nav className="flex items-center justify-between max-w-7xl mx-auto py-4 px-6">
        <div className="flex items-center space-x-6 font-semibold">
          <Link to="/">
            <img src="src/assets/logo.png" alt="Site Logo" className="h-10" />
          </Link>
          <div className="relative">
            <Search className="absolute text-neutral-600 right-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="px-3 py-1 rounded-lg bg-white text-black focus:outline-none"
            />
          </div>
        </div>
        <nav>
          <ul className="font-[Black_Ops_One] flex">
            <Link to="/">
              <li className="py-2 px-6 rounded-lg nav-hover-color">Home</li>
            </Link>
            <Link to="">
              <li className="py-2 px-6 rounded-lg nav-hover-color">News</li>
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
                <ul className="absolute rounded-b-lg rounded-tr-lg nav-ul-background shadow-md shadow-neutral-950/50">
                  <Link to="">
                    <li className="p-4 nav-li-background nav-border-bottom rounded-tr-lg">
                      Top Games
                    </li>
                  </Link>
                  <Link to="">
                    <li className="p-4 nav-li-background nav-border-bottom">
                      Latest Games
                    </li>
                  </Link>
                  <Link to="">
                    <li className="p-4 nav-li-background rounded-b-lg">
                      Upcoming Games
                    </li>
                  </Link>
                </ul>
              )}
            </li>
            <Link to="">
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
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none"
            aria-pressed={isDarkMode}
          >
            <span className="sr-only">Toggle dark mode</span>
            <div
              className={`
                  ${isDarkMode ? "bg-neutral-700" : "bg-cyan-400"} 
                  flex h-6 w-11 items-center rounded-full p-1 transition-colors duration-300
                `}
            >
              <div
                className={`
                    ${isDarkMode ? "translate-x-5" : "translate-x-0"} 
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
                  `}
              />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-12">
              {isDarkMode ? (
                <Moon size={14} className="text-white" />
              ) : (
                <Sun size={14} className="text-white" />
              )}
            </div>
          </button>
          <Link to="">
            <button className="font-[Black_Ops_One] text-sm py-2 px-6 rounded-full sign-in-btn hover:cursor-pointer">
              Sign in
            </button>
          </Link>
        </nav>
      </nav>
    </header>
  );
}
