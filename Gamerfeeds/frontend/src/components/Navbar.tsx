import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isGameDropdownActive, setGameDropdownState] = useState(false);

  return (
    <header className="w-screen fixed top-0 z-50 bg-cyan-600 dark:bg-neutral-950">
      <nav className="flex items-center justify-between max-w-7xl mx-auto py-4 px-6">
        <div className="flex items-center space-x-6 font-semibold">
          <Link to="/">
            <img src="src/assets/logo.png" alt="Site Logo" className="h-10" />
          </Link>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search. . ."
              className="px-3 py-1 rounded-lg bg-gray-100 focus:outline-none"
            />
          </div>
        </div>
        <nav>
          <ul className="font-[Black_Ops_One] flex text-lg dark:text-white">
            <Link to="/">
              <li className="py-2 px-6 rounded-lg hover:bg-neutral-800">
                Home
              </li>
            </Link>
            <Link to="">
              <li className="py-2 px-6 rounded-lg hover:bg-neutral-800">
                News
              </li>
            </Link>
            <li
              className={
                isGameDropdownActive ? "bg-neutral-800 rounded-t-lg" : ""
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
                <ul className="absolute rounded-b-lg rounded-tr-lg bg-neutral-800 text-base shadow-md shadow-neutral-950/50">
                  <Link to="">
                    <li className="p-4 hover:bg-neutral-700 border-b-1 border-b-neutral-700 rounded-tr-lg">
                      Top Games
                    </li>
                  </Link>
                  <Link to="">
                    <li className="p-4 hover:bg-neutral-700 border-b-1 border-b-neutral-700">
                      Latest Games
                    </li>
                  </Link>
                  <Link to="">
                    <li className="p-4 hover:bg-neutral-700 rounded-b-lg">
                      Upcoming Games
                    </li>
                  </Link>
                </ul>
              )}
            </li>
            <Link to="">
              <li className="py-2 px-6 rounded-lg hover:bg-neutral-800">
                Events
              </li>
            </Link>
            <Link to="">
              <li className="py-2 px-6 rounded-lg hover:bg-neutral-800">
                Discussion
              </li>
            </Link>
          </ul>
        </nav>
      </nav>
    </header>
  );
}
