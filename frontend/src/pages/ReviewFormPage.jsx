import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ReviewForm from "../components/ReviewForm.jsx";
import { EQUIPMENT_VALUES } from "../constants/equipment.js";
import "./ReviewFormPage.css";

/**
 * /reviews/new?recipeId=…  → write a review for that recipe
 * /reviews/:id/edit        → edit your own review
 * Both routes sit behind RequireAuth, so `user` is always set here.
 */
export default function ReviewFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = Boolean(id);
  const recipeId = searchParams.get("recipeId");
  // What to load: the review being edited, or the recipe being reviewed.
  const loadPath = isEdit
    ? `/api/reviews/${id}`
    : recipeId
      ? `/api/recipes/${recipeId}`
      : null;

  // The last finished request, keyed by path so a new path reads as loading.
  const [result, setResult] = useState({ path: null, data: null, error: null });
  const loading = loadPath !== null && result.path !== loadPath;
  const data = loading ? null : result.data;
  const error = loading ? null : result.error;

  useEffect(() => {
    if (!loadPath) return undefined;
    const controller = new AbortController();
    api(loadPath, { signal: controller.signal })
      .then((loaded) =>
        setResult({ path: loadPath, data: loaded, error: null }),
      )
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult({
          path: loadPath,
          data: null,
          error: err.status === 404 ? "not-found" : "Couldn't load this page.",
        });
      });
    return () => controller.abort();
  }, [loadPath]);

  if (!isEdit && !recipeId) {
    return (
      <Message title="Which recipe?">
        Open a recipe and choose <strong>Write a review</strong>.{" "}
        <Link to="/recipes">Browse recipes</Link>.
      </Message>
    );
  }

  if (loading) return <p className="loading">Loading…</p>;

  if (error === "not-found") {
    return isEdit ? (
      <Message title="Review not found">
        It may have been deleted. <Link to="/reviews">Browse all reviews</Link>.
      </Message>
    ) : (
      <Message title="Recipe not found">
        It may have been removed. <Link to="/recipes">Browse recipes</Link>.
      </Message>
    );
  }

  if (error) {
    return (
      <p className="review-form-page-error" role="alert">
        {error}
      </p>
    );
  }

  if (isEdit && String(data.authorId) !== String(user.id)) {
    return (
      <Message title="Not your review">
        You can only edit reviews you wrote.{" "}
        <Link to={`/reviews/${id}`}>Back to the review</Link>.
      </Message>
    );
  }

  const recipe = isEdit
    ? { id: data.recipeId, title: data.recipeTitle }
    : { id: data.id, title: data.title };

  const initialValues = isEdit
    ? {
        rating: data.rating,
        comment: data.comment,
        equipmentUsed: data.equipmentUsed,
      }
    : {
        rating: 0,
        comment: "",
        // Most people cook it the way the recipe says, so start with that checked.
        equipmentUsed: EQUIPMENT_VALUES.includes(data.equipment)
          ? [data.equipment]
          : [],
      };

  const backTo = isEdit ? `/reviews/${id}` : `/recipes/${recipe.id}`;

  async function handleSubmit(values) {
    if (isEdit) {
      await api(`/api/reviews/${id}`, { method: "PUT", body: values });
      navigate(`/reviews/${id}`, { replace: true });
    } else {
      const created = await api("/api/reviews", {
        method: "POST",
        body: { ...values, recipeId: recipe.id },
      });
      navigate(`/reviews/${created._id}`, { replace: true });
    }
  }

  return (
    <section className="review-form-page">
      <Link to={backTo} className="review-form-page-back">
        ‹ Back
      </Link>
      <header>
        <p className="review-form-page-eyebrow">
          {isEdit ? "Edit your review of" : "Write a review of"}
        </p>
        <h1 className="review-form-page-title">
          <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
        </h1>
      </header>

      <ReviewForm
        // Remount with fresh state if the user navigates to a different review.
        key={loadPath}
        initialValues={initialValues}
        submitLabel={isEdit ? "Save changes" : "Post review"}
        onSubmit={handleSubmit}
        onCancel={() => navigate(backTo)}
      />
    </section>
  );
}

function Message({ title, children }) {
  return (
    <section className="review-form-page">
      <h1>{title}</h1>
      <p>{children}</p>
    </section>
  );
}

Message.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
