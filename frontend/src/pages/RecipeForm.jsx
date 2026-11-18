import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { EQUIPMENT } from "../constants/equipment.js";
import "./RecipeForm.css";

const EMPTY_VALUES = {
  title: "",
  equipment: EQUIPMENT[0].value,
  prepTime: "",
  cost: "",
  ingredients: "",
  steps: "",
};

/** Recipe from the API -> form field strings. */
function toFormValues(recipe) {
  return {
    title: recipe.title,
    equipment: recipe.equipment,
    prepTime: String(recipe.prepTime),
    cost: recipe.cost == null ? "" : String(recipe.cost),
    ingredients: recipe.ingredients.join("\n"),
    steps: recipe.steps.join("\n"),
  };
}

/** One entry per non-blank line. */
function toLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Form field strings -> request body. Validation is left to the API so there
 * is a single source of truth for the rules; blank numbers become null so the
 * API reports them instead of us sending 0.
 */
function toRequestBody(values) {
  return {
    title: values.title.trim(),
    equipment: values.equipment,
    prepTime: values.prepTime === "" ? null : Number(values.prepTime),
    cost: values.cost === "" ? null : Number(values.cost),
    ingredients: toLines(values.ingredients),
    steps: toLines(values.steps),
  };
}

/**
 * Handles both /recipes/new and /recipes/:id/edit. In edit mode the recipe is
 * loaded first and the form only appears if the logged-in user owns it;
 * RequireAuth on the route only guarantees someone is logged in.
 */
export default function RecipeForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = id !== undefined;

  // The last finished load, keyed by id so a new id reads as loading.
  const [result, setResult] = useState({ id: null, recipe: null, error: null });
  const loading = isEdit && result.id !== id;

  useEffect(() => {
    if (!isEdit) return;
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
  }, [id, isEdit]);

  if (!isEdit) {
    return <RecipeEditor key="new" initialValues={EMPTY_VALUES} />;
  }

  if (loading) {
    return <p className="loading">Loading recipe…</p>;
  }

  if (result.error === "not-found") {
    return (
      <section className="recipe-form-page">
        <h1>Recipe not found</h1>
        <p>
          It may have been deleted.{" "}
          <Link to="/recipes">Browse all recipes</Link>.
        </p>
      </section>
    );
  }

  if (result.error) {
    return (
      <p className="recipe-form-blocked" role="alert">
        {result.error}
      </p>
    );
  }

  if (!user || String(user.id) !== String(result.recipe.ownerId)) {
    return (
      <section className="recipe-form-page">
        <h1>Edit recipe</h1>
        <p className="recipe-form-blocked" role="alert">
          You can only edit recipes you posted.{" "}
          <Link to={`/recipes/${id}`}>Back to the recipe</Link>.
        </p>
      </section>
    );
  }

  return (
    <RecipeEditor
      key={id}
      recipeId={id}
      initialValues={toFormValues(result.recipe)}
    />
  );
}

/** The form itself. Remounted (via key) whenever the recipe being edited changes. */
function RecipeEditor({ recipeId, initialValues }) {
  const navigate = useNavigate();
  const isEdit = recipeId !== undefined;
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const saved = await api(
        isEdit ? `/api/recipes/${recipeId}` : "/api/recipes",
        { method: isEdit ? "PUT" : "POST", body: toRequestBody(values) },
      );
      navigate(`/recipes/${saved.id}`);
    } catch (err) {
      setError({
        message:
          err.status === 401
            ? "Your session has expired. Please log in again."
            : err.message || "Couldn't save this recipe.",
        details: err.details ?? [],
      });
      setSubmitting(false);
    }
  }

  return (
    <section className="recipe-form-page">
      <h1>{isEdit ? "Edit recipe" : "Post a recipe"}</h1>

      {/* noValidate: the API's messages are the single source of truth. */}
      <form className="recipe-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="recipe-form-errors" role="alert">
            <p>{error.message}</p>
            {error.details.length > 0 && (
              <ul>
                {error.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label className="recipe-form-field">
          Title
          <input
            name="title"
            value={values.title}
            onChange={handleChange}
            aria-required="true"
          />
        </label>

        <div className="recipe-form-row">
          <label className="recipe-form-field">
            Equipment
            <select
              name="equipment"
              value={values.equipment}
              onChange={handleChange}
            >
              {EQUIPMENT.map(({ value, label, icon }) => (
                <option key={value} value={value}>
                  {icon} {label}
                </option>
              ))}
            </select>
          </label>
          <label className="recipe-form-field">
            Prep time (minutes)
            <input
              name="prepTime"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={values.prepTime}
              onChange={handleChange}
              aria-required="true"
            />
          </label>
          <label className="recipe-form-field">
            <span>
              Cost ($) <span className="recipe-form-optional">optional</span>
            </span>
            <input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={values.cost}
              onChange={handleChange}
            />
          </label>
        </div>

        <label className="recipe-form-field">
          <span>
            Ingredients <span className="recipe-form-hint">one per line</span>
          </span>
          <textarea
            name="ingredients"
            rows={6}
            value={values.ingredients}
            onChange={handleChange}
            aria-required="true"
          />
        </label>

        <label className="recipe-form-field">
          <span>
            Steps <span className="recipe-form-hint">one per line</span>
          </span>
          <textarea
            name="steps"
            rows={8}
            value={values.steps}
            onChange={handleChange}
            aria-required="true"
          />
        </label>

        <div className="recipe-form-actions">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Post recipe"}
          </button>
          <Link
            to={isEdit ? `/recipes/${recipeId}` : "/recipes"}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

RecipeEditor.propTypes = {
  recipeId: PropTypes.string,
  initialValues: PropTypes.shape({
    title: PropTypes.string.isRequired,
    equipment: PropTypes.string.isRequired,
    prepTime: PropTypes.string.isRequired,
    cost: PropTypes.string.isRequired,
    ingredients: PropTypes.string.isRequired,
    steps: PropTypes.string.isRequired,
  }).isRequired,
};
