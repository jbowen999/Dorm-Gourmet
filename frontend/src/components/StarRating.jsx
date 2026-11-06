import PropTypes from "prop-types";
import "./StarRating.css";

/** Read-only star display. Forms use a radio-group fieldset instead (see ReviewForm). */
export default function StarRating({ rating, max = 5 }) {
  const rounded = Math.round(rating);
  return (
    <span className="star-rating" role="img" aria-label={`${rating} out of ${max} stars`}>
      <span className="star-rating-filled" aria-hidden="true">
        {"★".repeat(rounded)}
      </span>
      <span className="star-rating-empty" aria-hidden="true">
        {"☆".repeat(max - rounded)}
      </span>
    </span>
  );
}

StarRating.propTypes = {
  rating: PropTypes.number.isRequired,
  max: PropTypes.number,
};
