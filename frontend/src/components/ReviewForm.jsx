import PropTypes from "prop-types";
import { useState } from "react";
import { EQUIPMENT } from "../constants/equipment.js";
import "./ReviewForm.css";

export const MAX_COMMENT_LENGTH = 2000;
const RATINGS = [1, 2, 3, 4, 5];

/** Mirrors the server's checks in backend/routes/reviews.js. */
function validate({ rating, comment, equipmentUsed }) {
  const errors = {};
  if (!RATINGS.includes(rating))
    errors.rating = "Pick a rating from 1 to 5 stars.";
  if (equipmentUsed.length === 0)
    errors.equipmentUsed = "Pick the equipment you used.";
  const trimmed = comment.trim();
  if (!trimmed) errors.comment = "Tell people how it went.";
  else if (trimmed.length > MAX_COMMENT_LENGTH) {
    errors.comment = `Keep it under ${MAX_COMMENT_LENGTH} characters.`;
  }
  return errors;
}

/** Field order, used to focus the first field with a problem. */
const FIELD_ORDER = ["rating", "equipmentUsed", "comment"];

/**
 * Create/edit form for a review. The parent supplies initialValues and an
 * async onSubmit; errors thrown by onSubmit (with optional err.fieldErrors
 * from the API) are shown next to the matching fields.
 */
export default function ReviewForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [rating, setRating] = useState(initialValues.rating);
  const [equipmentUsed, setEquipmentUsed] = useState(
    initialValues.equipmentUsed,
  );
  const [comment, setComment] = useState(initialValues.comment);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /** Hides a field's error as soon as the user changes that field. */
  function clearError(name) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function toggleEquipment(value) {
    setEquipmentUsed((current) =>
      current.includes(value)
        ? current.filter((e) => e !== value)
        : [...current, value],
    );
    clearError("equipmentUsed");
  }

  function focusFirstError(form, fieldErrors) {
    const first = FIELD_ORDER.find((name) => fieldErrors[name]);
    if (!first) return;
    const el = form.elements.namedItem(first);
    // Radio and checkbox groups come back as a list; focus the first input.
    (el instanceof RadioNodeList ? el[0] : el)?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = { rating, equipmentUsed, comment: comment.trim() };

    const clientErrors = validate(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) {
      focusFirstError(form, clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      const fieldErrors = err.fieldErrors ?? {};
      setErrors(fieldErrors);
      // Problems with a visible field show inline. Anything else goes up
      // top: errors for fields not on the form (e.g. recipeId when the recipe
      // was deleted meanwhile), or a non-validation failure (403, 500).
      const known = FIELD_ORDER.some((name) => fieldErrors[name]);
      const otherFieldMessage = Object.entries(fieldErrors).find(
        ([name]) => !FIELD_ORDER.includes(name),
      )?.[1];
      setFormError(
        otherFieldMessage ??
          (known
            ? null
            : err.message || "Couldn't save your review. Please try again."),
      );
      if (known) focusFirstError(form, fieldErrors);
      setSubmitting(false);
    }
  }

  const describedBy = (name, extra) =>
    [errors[name] && `review-${name}-error`, extra].filter(Boolean).join(" ") ||
    undefined;

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="review-form-alert" role="alert">
          {formError}
        </p>
      )}

      <fieldset
        className="review-form-group"
        aria-invalid={Boolean(errors.rating)}
        aria-describedby={describedBy("rating")}
      >
        <legend>Rating</legend>
        <div className="review-form-stars">
          {RATINGS.map((value) => (
            <label key={value} className="review-form-star">
              <input
                className="visually-hidden"
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => {
                  setRating(value);
                  clearError("rating");
                }}
              />
              <span
                className={`review-form-star-icon ${value <= rating ? "is-filled" : ""}`}
                aria-hidden="true"
              >
                ★
              </span>
              <span className="visually-hidden">
                {value} {value === 1 ? "star" : "stars"}
              </span>
            </label>
          ))}
          <span className="review-form-star-text" aria-hidden="true">
            {rating ? `${rating} / 5` : "Not rated"}
          </span>
        </div>
        {errors.rating && (
          <p id="review-rating-error" className="review-form-error">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <fieldset
        className="review-form-group"
        aria-invalid={Boolean(errors.equipmentUsed)}
        aria-describedby={describedBy("equipmentUsed", "review-equipment-hint")}
      >
        <legend>Equipment used</legend>
        <p id="review-equipment-hint" className="review-form-hint">
          What did you actually cook it with?
        </p>
        <div className="review-form-options">
          {EQUIPMENT.map(({ value, label, icon }) => (
            <label key={value} className="review-form-option">
              <input
                type="checkbox"
                name="equipmentUsed"
                value={value}
                checked={equipmentUsed.includes(value)}
                onChange={() => toggleEquipment(value)}
              />
              <span aria-hidden="true">{icon}</span> {label}
            </label>
          ))}
        </div>
        {errors.equipmentUsed && (
          <p id="review-equipmentUsed-error" className="review-form-error">
            {errors.equipmentUsed}
          </p>
        )}
      </fieldset>

      <div className="review-form-group">
        <label htmlFor="review-comment" className="review-form-label">
          Comment
        </label>
        <textarea
          id="review-comment"
          name="comment"
          rows={6}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder="How did it turn out? Any tips for someone with your setup?"
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            clearError("comment");
          }}
          aria-invalid={Boolean(errors.comment)}
          aria-describedby={describedBy("comment", "review-comment-count")}
        />
        <p
          id="review-comment-count"
          className="review-form-hint review-form-count"
        >
          {comment.length} / {MAX_COMMENT_LENGTH}
        </p>
        {errors.comment && (
          <p id="review-comment-error" className="review-form-error">
            {errors.comment}
          </p>
        )}
      </div>

      <div className="review-form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

ReviewForm.propTypes = {
  initialValues: PropTypes.shape({
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string.isRequired,
    equipmentUsed: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  submitLabel: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
