import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import EquipmentBadge from "../components/EquipmentBadge.jsx";
import StarRating from "../components/StarRating.jsx";
import { formatDate } from "../utils/format.js";
import "./ReviewDetailPage.css";

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // The last finished request, keyed by id so a new id reads as loading.
  const [result, setResult] = useState({ id: null, review: null, error: null });
  const loading = result.id !== id;
  const review = loading ? null : result.review;
  const error = loading ? null : result.error;

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const cancelDeleteRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    api(`/api/reviews/${id}`, { signal: controller.signal })
      .then((data) => setResult({ id, review: data, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult({
          id,
          review: null,
          error:
            err.status === 404
              ? "not-found"
              : "Couldn't load this review. Please try again.",
        });
      });
    return () => controller.abort();
  }, [id]);

  // Move focus to "Cancel" when the confirmation appears, so keyboard and
  // screen reader users land on the safe choice.
  useEffect(() => {
    if (confirmingDelete) cancelDeleteRef.current?.focus();
  }, [confirmingDelete]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/api/reviews/${id}`, { method: "DELETE" });
      navigate("/reviews", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Couldn't delete this review.");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="loading">Loading review…</p>;
  }

  if (error === "not-found") {
    return (
      <section className="review-detail">
        <h1>Review not found</h1>
        <p>
          It may have been deleted.{" "}
          <Link to="/reviews">Browse all reviews</Link>.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <p className="review-detail-error" role="alert">
        {error}
      </p>
    );
  }

  const isOwner = Boolean(user) && String(user.id) === String(review.authorId);
  const edited = review.updatedAt !== review.createdAt;

  return (
    <article className="review-detail">
      <Link to="/reviews" className="review-detail-back">
        ‹ Back to reviews
      </Link>

      <header className="review-detail-header">
        <div>
          <p className="review-detail-eyebrow">Review of</p>
          <h1 className="review-detail-title">
            {review.recipeExists ? (
              <Link to={`/recipes/${review.recipeId}`}>
                {review.recipeTitle}
              </Link>
            ) : (
              review.recipeTitle
            )}
          </h1>
          {!review.recipeExists && (
            <p className="review-detail-removed">
              This recipe has been removed.
            </p>
          )}
        </div>

        {isOwner && !confirmingDelete && (
          <div className="review-detail-actions">
            <Link to={`/reviews/${id}/edit`} className="btn btn-secondary">
              Edit
            </Link>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          </div>
        )}
      </header>

      {confirmingDelete && (
        <div
          className="review-detail-confirm"
          role="alertdialog"
          aria-labelledby="confirm-delete-title"
        >
          <p id="confirm-delete-title">
            Delete this review? This can&apos;t be undone.
          </p>
          {deleteError && (
            <p className="error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="review-detail-actions">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              ref={cancelDeleteRef}
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setConfirmingDelete(false);
                setDeleteError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="review-detail-rating">
        <StarRating rating={review.rating} />
        <span>{review.rating} / 5</span>
      </div>

      <dl className="review-detail-meta">
        <div>
          <dt>Equipment used</dt>
          <dd>
            {review.equipmentUsed.map((e) => (
              <EquipmentBadge key={e} value={e} />
            ))}
          </dd>
        </div>
        <div>
          <dt>Reviewer</dt>
          <dd>{review.authorName}</dd>
        </div>
        <div>
          <dt>Posted</dt>
          <dd>
            <time dateTime={review.createdAt}>
              {formatDate(review.createdAt)}
            </time>
          </dd>
        </div>
        {edited && (
          <div>
            <dt>Updated</dt>
            <dd>
              <time dateTime={review.updatedAt}>
                {formatDate(review.updatedAt)}
              </time>
            </dd>
          </div>
        )}
      </dl>

      <blockquote className="review-detail-comment">
        <p>{review.comment}</p>
      </blockquote>
    </article>
  );
}
