import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import EquipmentBadge from "../components/EquipmentBadge.jsx";
import { formatDate } from "../utils/format.js";
import "./RecipeDetail.css";

function formatCost(cost) {
  return cost == null ? "Not listed" : `$${cost.toFixed(2)}`;
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // The last finished request, keyed by id so a new id reads as loading.
  const [result, setResult] = useState({ id: null, recipe: null, error: null });
  const loading = result.id !== id;
  const recipe = loading ? null : result.recipe;
  const error = loading ? null : result.error;

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const cancelDeleteRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    api(`/api/recipes/${id}`, { signal: controller.signal })
      .then((data) => setResult({ id, recipe: data, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult({
          id,
          recipe: null,
          error:
            err.status === 404
              ? "not-found"
              : "Couldn't load this recipe. Please try again.",
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
      await api(`/api/recipes/${id}`, { method: "DELETE" });
      navigate("/recipes", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Couldn't delete this recipe.");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="loading">Loading recipe…</p>;
  }

  if (error === "not-found") {
    return (
      <section className="recipe-detail">
        <h1>Recipe not found</h1>
        <p>
          It may have been deleted.{" "}
          <Link to="/recipes">Browse all recipes</Link>.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <p className="recipe-detail-error" role="alert">
        {error}
      </p>
    );
  }

  const isOwner = Boolean(user) && String(user.id) === String(recipe.ownerId);

  return (
    <article className="recipe-detail">
      <Link to="/recipes" className="recipe-detail-back">
        ‹ Back to recipes
      </Link>

      <header className="recipe-detail-header">
        <h1 className="recipe-detail-title">{recipe.title}</h1>

        {isOwner && !confirmingDelete && (
          <div className="recipe-detail-actions">
            <Link to={`/recipes/${id}/edit`} className="btn btn-secondary">
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
          className="recipe-detail-confirm"
          role="alertdialog"
          aria-labelledby="confirm-delete-title"
        >
          <p id="confirm-delete-title">
            Delete this recipe? This can&apos;t be undone.
          </p>
          {deleteError && (
            <p className="error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="recipe-detail-actions">
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

      <dl className="recipe-detail-meta">
        <div>
          <dt>Equipment</dt>
          <dd>
            <EquipmentBadge value={recipe.equipment} />
          </dd>
        </div>
        <div>
          <dt>Prep time</dt>
          <dd>{recipe.prepTime} min</dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>{formatCost(recipe.cost)}</dd>
        </div>
        <div>
          <dt>Posted by</dt>
          <dd>{recipe.ownerUsername ?? "Unknown user"}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>
            <time dateTime={recipe.updatedAt}>
              {formatDate(recipe.updatedAt)}
            </time>
          </dd>
        </div>
      </dl>

      <section aria-labelledby="ingredients-title">
        <h2 id="ingredients-title" className="recipe-detail-section-title">
          Ingredients
        </h2>
        <ul className="recipe-detail-ingredients">
          {recipe.ingredients.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="recipe-detail-section-title">
          Steps
        </h2>
        <ol className="recipe-detail-steps">
          {recipe.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
