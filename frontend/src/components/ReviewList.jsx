import PropTypes from "prop-types";
import ReviewCard, { reviewShape } from "./ReviewCard.jsx";
import "./ReviewList.css";

export default function ReviewList({
  reviews,
  showRecipe = true,
  emptyMessage = "No reviews match these filters.",
}) {
  if (reviews.length === 0) {
    return <p className="review-list-empty">{emptyMessage}</p>;
  }

  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <li key={review._id}>
          <ReviewCard review={review} showRecipe={showRecipe} />
        </li>
      ))}
    </ul>
  );
}

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(reviewShape).isRequired,
  showRecipe: PropTypes.bool,
  emptyMessage: PropTypes.string,
};
