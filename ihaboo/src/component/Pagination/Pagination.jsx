import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Function to calculate the range of pages to display
  const getPaginationRange = () => {
    // If there are exactly 2 pages, just return [1, 2]
    if (totalPages === 2) {
      return [1, 2];
    }

    const pages = [];

    // Always include the first page
    pages.push(1);

    // If the current page is near the start
    if (currentPage <= 2) {
      if (totalPages > 1) pages.push(2);
      if (totalPages > 2) pages.push('...');
    }
    // If the current page is in the middle
    else if (currentPage > 2 && currentPage < totalPages - 1) {
      pages.push('...');
      pages.push(currentPage);
      pages.push('...');
    }
    // If the current page is near the end
    else if (currentPage >= totalPages - 1) {
      if (totalPages > 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages - 1);
    }

    // Always include the last page (if more than one page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const paginationRange = getPaginationRange();

  return (
    <div className="flex justify-center mt-5">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`bg-gray-200 text-gray-700 px-3 py-2 mx-1 rounded ${
          currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800 hover:text-white'
        }`}
      >
        &lt;
      </button>

      {/* Page numbers */}
      {paginationRange.map((pageNumber, index) =>
        typeof pageNumber === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(pageNumber)}
            className={`px-3 py-2 mx-1 rounded ${
              pageNumber === currentPage
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {pageNumber}
          </button>
        ) : (
          <span
            key={index}
            className="px-3 py-2 mx-1 text-gray-500 select-none"
          >
            ...
          </span>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`bg-gray-200 text-gray-700 px-3 py-2 mx-1 rounded ${
          currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800 hover:text-white'
        }`}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;