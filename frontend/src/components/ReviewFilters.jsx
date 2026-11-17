import PropTypes from "prop-types";
import { EQUIPMENT } from "../constants/equipment.js";
import "./ReviewFilters.css";

const RATING_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 2, label: "2+ stars" },
  { value: 3, label: "3+ stars" },
  { value: 4, label: "4+ stars" },
  { value: 5, label: "5 stars" },
];

export default function ReviewFilters({
  equipment,
  minRating,
  onEquipmentChange,
  onMinRatingChange,
  onClear,
}) {
  function toggleEquipment(value) {
    onEquipmentChange(
      equipment.includes(value)
        ? equipment.filter((e) => e !== value)
        : [...equipment, value],
    );
  }

  const hasFilters = equipment.length > 0 || minRating > 0;

  return (
    <aside className="review-filters" aria-labelledby="review-filters-title">
      <h2 id="review-filters-title" className="review-filters-title">
        Filters
      </h2>

      <fieldset className="review-filters-group">
        <legend>Equipment used</legend>
        {EQUIPMENT.map(({ value, label, icon }) => (
          <label key={value} className="review-filters-option">
            <input
              type="checkbox"
              checked={equipment.includes(value)}
              onChange={() => toggleEquipment(value)}
            />
            <span aria-hidden="true">{icon}</span> {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="review-filters-group">
        <legend>Minimum rating</legend>
        {RATING_OPTIONS.map(({ value, label }) => (
          <label key={value} className="review-filters-option">
            <input
              type="radio"
              name="minRating"
              value={value}
              checked={minRating === value}
              onChange={() => onMinRatingChange(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClear}
        disabled={!hasFilters}
      >
        Clear filters
      </button>
    </aside>
  );
}

ReviewFilters.propTypes = {
  equipment: PropTypes.arrayOf(PropTypes.string).isRequired,
  minRating: PropTypes.number.isRequired,
  onEquipmentChange: PropTypes.func.isRequired,
  onMinRatingChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};
