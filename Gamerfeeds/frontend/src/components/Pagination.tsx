import React, { useState, useEffect } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const pageNumber = parseInt(inputPage, 10);
      if (!isNaN(pageNumber)) {
        handlePageChange(pageNumber);
      }
    }
  };

  const handlePageChange = (pageNumber: number) => {
    const validPage = Math.max(1, Math.min(pageNumber, totalPages));
    onPageChange(validPage);
    setInputPage(validPage.toString());
  };

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  return (
    <div
      className={`flex justify-center items-center gap-3 font-[Hubot_Sans] font-semibold ${className}`}
    >
      <button
        onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
        disabled={currentPage === 1}
        className="px-5 py-2 custom-button text-white rounded-lg hover:cursor-pointer 
                  disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <h3 className="px-5">
        Page
        <input
          type="number"
          value={inputPage}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          min="1"
          max={totalPages}
          className="text-neutral-900 bg-white mx-2 rounded-sm border border-neutral-800 text-center w-10
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        of {totalPages}
      </h3>
      <button
        onClick={() =>
          handlePageChange(
            currentPage < totalPages ? currentPage + 1 : totalPages
          )
        }
        disabled={currentPage === totalPages}
        className="px-5 py-2 custom-button text-white rounded-lg hover:cursor-pointer 
                  disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
