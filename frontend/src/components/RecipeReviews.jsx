import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { EQUIPMENT } from "../constants/equipment.js";
import { pluralize } from "../utils/format.js";
import { toQueryString } from "../utils/query.js";
import Pagination from "./Pagination.jsx";
import ReviewList from "./ReviewList.jsx";
import StarRating from "./StarRating.jsx";
import "./RecipeReviews.css";

const PAGE_SIZE = 5;

const RATING_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 2, label: "2+ stars" },
  { value: 3, label: "3+ stars" },
  { value: 4, label: "4+ stars" },
  { value: 5, label: "5 stars" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

/**
 * Fetches `path` and returns { data, error, loading }. While a new path
 * loads, the previous data stays available so lists don't flash empty.
 */
function useApiResult(path) {
  const [result, setResult] = useState({ path: null, data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    api(path, { signal: controller.signal })
      .then((data) => setResult({ path, data, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult((prev) => ({ path, data: prev.data, error: err }));
      });
    return () => controller.abort();
  }, [path]);

  const loading = result.path !== path;
  return { data: result.data, error: loading ? null : result.error, loading };
}

/**
 * Reviews section for the recipe detail page: overall rating, equipment and
 * rating filters, sort, paged review cards, and a "Write a review" link.
 *
 * Usage: <RecipeReviews recipeId={recipe.id} />
 */
export default function RecipeReviews({ recipeId }) {
  const [equipment, setEquipment] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Overall numbers for the header, unaffected by the filters below.
  const summary = useApiResult(
    `/api/reviews${toQueryString({ recipeId, limit: 1 })}`,
  );

  const list = useApiResult(
    `/api/reviews${toQueryString({
      recipeId,
      equipment,
      minRating: minRating || undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    })}`,
  );

  // Any filter change goes back to page 1.
  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  const total = summary.data?.total ?? 0;
  const average = summary.data?.averageRating;
  const filtered = Boolean(equipment) || minRating > 0;
  const writeLink = `/reviews/new?recipeId=${recipeId}`;

  return (
    <section className="recipe-reviews" aria-labelledby="recipe-reviews-title">
      <header className="recipe-reviews-header">
        <div className="recipe-reviews-heading">
          <h2 id="recipe-reviews-title">Reviews</h2>
          {summary.data && total > 0 && (
            <p className="recipe-reviews-summary">
              <StarRating rating={average} />
              <span>
                {average} average ({pluralize(total, "review")})
              </span>
            </p>
          )}
        </div>
        <Link to={writeLink} className="btn">
          + Write a review
        </Link>
      </header>

      {summary.data && total === 0 ? (
        <p className="recipe-reviews-empty">
          No reviews yet. <Link to={writeLink}>Be the first to try it</Link> and
          say how it went.
        </p>
      ) : (
        <>
          <div className="recipe-reviews-filters">
            <FilterSelect
              id="recipe-reviews-equipment"
              label="Equipment used"
              value={equipment}
              onChange={changeFilter(setEquipment)}
              options={[
                { value: "", label: "Any" },
                ...EQUIPMENT.map(({ value, label }) => ({ value, label })),
              ]}
            />
            <FilterSelect
              id="recipe-reviews-rating"
              label="Min rating"
              value={minRating}
              onChange={changeFilter((v) => setMinRating(Number(v)))}
              options={RATING_OPTIONS}
            />
            <FilterSelect
              id="recipe-reviews-sort"
              label="Sort by"
              value={sort}
              onChange={changeFilter(setSort)}
              options={SORT_OPTIONS}
            />
          </div>

          {filtered && list.data && !list.loading && (
            <p className="recipe-reviews-count" aria-live="polite">
              Showing {pluralize(list.data.total, "review")}
              {list.data.averageRating != null &&
                ` · ★ ${list.data.averageRating} average`}
            </p>
          )}

          {list.error ? (
            <p className="recipe-reviews-error" role="alert">
              Couldn&apos;t load reviews. Please try again.
            </p>
          ) : list.data ? (
            <div
              className={list.loading ? "recipe-reviews-loading" : undefined}
              aria-busy={list.loading}
            >
              <ReviewList
                reviews={list.data.reviews}
                showRecipe={false}
                emptyMessage="No reviews match these filters."
              />
              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <p className="loading">Loading reviews…</p>
          )}
        </>
      )}
    </section>
  );
}

RecipeReviews.propTypes = {
  recipeId: PropTypes.string.isRequired,
};

function FilterSelect({ id, label, value, onChange, options }) {
  return (
    <div className="recipe-reviews-filter">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

FilterSelect.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
};
