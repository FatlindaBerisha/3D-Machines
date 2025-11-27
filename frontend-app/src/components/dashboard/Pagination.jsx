import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];

  function addPage(num) {
    pages.push(
      <button
        key={num}
        onClick={() => onPageChange(num)}
        className={`pagination-btn ${currentPage === num ? "active" : ""}`}
        aria-current={currentPage === num ? "page" : undefined}
      >
        {num}
      </button>
    );
  }

  pages.push(
    <button
      key="first"
      onClick={() => onPageChange(1)}
      className="pagination-arrow"
      disabled={currentPage === 1}
      aria-label="First page"
      title="First page"
    >
      &#171;
    </button>
  );

  pages.push(
    <button
      key="prev"
      onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
      className="pagination-arrow"
      disabled={currentPage === 1}
      aria-label="Previous page"
      title="Previous page"
    >
      &lt;
    </button>
  );

  if (totalPages <= 4) {
    for (let i = 1; i <= totalPages; i++) {
      addPage(i);
    }
  } else {
    if (currentPage <= 3) {
      addPage(1);
      addPage(2);
      addPage(3);
      pages.push(
        <span key="dots-right" className="pagination-dots">
          ...
        </span>
      );
      addPage(totalPages);
    } 
    else if (currentPage >= totalPages - 2) {
      addPage(1);
      pages.push(
        <span key="dots-left" className="pagination-dots">
          ...
        </span>
      );
      for (let i = totalPages - 2; i <= totalPages; i++) {
        addPage(i);
      }
    } 
    else {
      addPage(1);
      pages.push(
        <span key="dots-left" className="pagination-dots">
          ...
        </span>
      );
      addPage(currentPage - 1);
      addPage(currentPage);
      addPage(currentPage + 1);
      pages.push(
        <span key="dots-right" className="pagination-dots">
          ...
        </span>
      );
      addPage(totalPages);
    }
  }

  pages.push(
    <button
      key="next"
      onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
      className="pagination-arrow"
      disabled={currentPage === totalPages}
      aria-label="Next page"
      title="Next page"
    >
      &gt;
    </button>
  );

  pages.push(
    <button
      key="last"
      onClick={() => onPageChange(totalPages)}
      className="pagination-arrow"
      disabled={currentPage === totalPages}
      aria-label="Last page"
      title="Last page"
    >
      &#187;
    </button>
  );

  return <div className="pagination-wrapper">{pages}</div>;
}