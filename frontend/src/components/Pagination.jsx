import PropTypes from "prop-types";
import "./Pagination.css";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹ Prev
      </button>
      <span className="pagination-status" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next ›
      </button>
    </nav>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
