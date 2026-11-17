import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/format.js";
import EquipmentBadge from "./EquipmentBadge.jsx";
import StarRating from "./StarRating.jsx";
import "./ReviewCard.css";

/**
 * One review in a list. Set showRecipe={false} when the list is already
 * scoped to one recipe (e.g. on the recipe detail page).
 */
export default function ReviewCard({ review, showRecipe = true }) {
  const edited = review.updatedAt && review.updatedAt !== review.createdAt;

  return (
    <article className="review-card">
      <header className="review-card-header">
        <StarRating rating={review.rating} />
        {showRecipe && (
          <h3 className="review-card-recipe">
            <Link to={`/recipes/${review.recipeId}`}>{review.recipeTitle}</Link>
          </h3>
        )}
      </header>

      <p className="review-card-comment">“{review.comment}”</p>

      <footer className="review-card-meta">
        {review.equipmentUsed.map((e) => (
          <EquipmentBadge key={e} value={e} />
        ))}
        <span>
          by {review.authorName} ·{" "}
          <time dateTime={review.createdAt}>
            {formatDate(review.createdAt)}
          </time>
          {edited && " (edited)"}
        </span>
        <Link className="review-card-more" to={`/reviews/${review._id}`}>
          Read more
          <span className="visually-hidden">
            {" "}
            of {review.authorName}&apos;s review
          </span>
        </Link>
      </footer>
    </article>
  );
}

export const reviewShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  recipeId: PropTypes.string.isRequired,
  recipeTitle: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
  comment: PropTypes.string.isRequired,
  equipmentUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  authorName: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
});

ReviewCard.propTypes = {
  review: reviewShape.isRequired,
  showRecipe: PropTypes.bool,
};
