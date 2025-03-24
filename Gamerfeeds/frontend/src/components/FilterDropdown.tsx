import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";

interface FilterOption {
  id: string | number;
  name: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedOptions: string[];
  isLoading: boolean;
  error: string | null;
  onToggleOption: (optionName: string) => void;
  allLabel?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export default function FilterDropdown({
  label,
  options,
  selectedOptions,
  isLoading,
  error,
  onToggleOption,
  emptyMessage = "No options available",
  loadingMessage = "Loading...",
}: FilterDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionToggle = (optionName: string) => {
    onToggleOption(optionName);
    setIsDropdownOpen(false);
  };

  const getSummaryText = () => {
    if (selectedOptions.length === 0) {
      return `All ${label}`;
    } else if (selectedOptions.length === 1) {
      return selectedOptions[0];
    } else {
      return `${selectedOptions.length} ${label.toLowerCase()} selected`;
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <h2 className="block font-bold">{label}:</h2>
      <div className="relative">
        <button
          onClick={toggleDropdown}
          disabled={isLoading}
          className="w-full p-2 filter-button rounded-sm hover:cursor-pointer flex justify-between items-center"
        >
          <span>{getSummaryText()}</span>
          {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1 filter-button rounded-md shadow-lg max-h-40 overflow-y-auto">
            <div className="py-1">
              {isLoading ? (
                <p className="px-3 py-2">{loadingMessage}</p>
              ) : error ? (
                <p className="px-3 py-2 text-red-500">Error: {error}</p>
              ) : options.length === 0 ? (
                <p className="px-3 py-2">{emptyMessage}</p>
              ) : (
                options.map((option) => (
                  <div
                    key={option.id}
                    className="px-3 py-2 filter-button cursor-pointer flex items-center hover:bg-opacity-70"
                    onClick={() => handleOptionToggle(option.name)}
                  >
                    <div className="w-5 h-5 border rounded mr-2 flex justify-center items-center">
                      {selectedOptions.includes(option.name) && (
                        <Check size={16} />
                      )}
                    </div>
                    <span>{option.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected options display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((option) => (
            <div
              key={option}
              className="filter-button px-2 py-1 rounded-md flex items-center text-xs"
            >
              {option}
              <button
                onClick={() => onToggleOption(option)}
                className="ml-1 focus:outline-none"
              >
                <X size={12} className="hover:cursor-pointer" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
