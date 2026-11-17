import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import Pagination from "../components/Pagination.jsx";
import ReviewFilters from "../components/ReviewFilters.jsx";
import ReviewList from "../components/ReviewList.jsx";
import { EQUIPMENT_VALUES } from "../constants/equipment.js";
import { pluralize } from "../utils/format.js";
import { toQueryString } from "../utils/query.js";
import "./ReviewsPage.css";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

/** Reads filters from the URL so views can be bookmarked, shared and navigated back to. */
function readParams(searchParams) {
  const rating = Number(searchParams.get("minRating"));
  const page = Number(searchParams.get("page"));
  const sort = searchParams.get("sort");
  return {
    q: searchParams.get("q") ?? "",
    equipment: (searchParams.get("equipment") ?? "")
      .split(",")
      .filter((e) => EQUIPMENT_VALUES.includes(e)),
    minRating:
      Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 0,
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "newest",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export default function ReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readParams(searchParams);
  const { q, equipment, minRating, sort, page } = params;
  const equipmentKey = equipment.join(",");

  const requestQs = toQueryString({
    q,
    equipment: equipmentKey,
    minRating: minRating || undefined,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  // The last finished request. While a new one is in flight, the previous
  // results stay on screen (dimmed) instead of flashing to a spinner.
  const [result, setResult] = useState({ qs: null, data: null, error: null });
  const loading = result.qs !== requestQs;
  const { data } = result;
  const error = loading ? null : result.error;

  useEffect(() => {
    const controller = new AbortController();
    api(`/api/reviews${requestQs}`, { signal: controller.signal })
      .then((data) => setResult({ qs: requestQs, data, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult((prev) => ({
          qs: requestQs,
          data: prev.data,
          error: "Couldn't load reviews. Please try again.",
        }));
      });
    return () => controller.abort();
  }, [requestQs]);

  /** Merges changes into the URL. Any filter change goes back to page 1. */
  function updateParams(changes, { resetPage = true } = {}) {
    const next = { ...params, ...changes };
    if (resetPage) next.page = 1;
    setSearchParams(
      toQueryString({
        q: next.q.trim(),
        equipment: next.equipment,
        minRating: next.minRating || undefined,
        sort: next.sort === "newest" ? undefined : next.sort,
        page: next.page > 1 ? next.page : undefined,
      }).slice(1),
    );
  }

  function handleSearch(event) {
    event.preventDefault();
    updateParams({
      q: String(new FormData(event.currentTarget).get("q") ?? ""),
    });
  }

  function handlePageChange(nextPage) {
    updateParams({ page: nextPage }, { resetPage: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="reviews-page">
      <h1 className="reviews-page-title">Reviews</h1>

      <div className="reviews-page-body">
        <ReviewFilters
          equipment={equipment}
          minRating={minRating}
          onEquipmentChange={(value) => updateParams({ equipment: value })}
          onMinRatingChange={(value) => updateParams({ minRating: value })}
          onClear={() => updateParams({ equipment: [], minRating: 0 })}
        />

        <section
          className="reviews-page-results"
          aria-labelledby="reviews-results-title"
        >
          <h2 id="reviews-results-title" className="visually-hidden">
            Results
          </h2>

          <form
            className="reviews-page-search"
            role="search"
            onSubmit={handleSearch}
          >
            <label htmlFor="reviews-search" className="visually-hidden">
              Search by recipe name
            </label>
            {/* key resets the box when q changes via back/forward or a link */}
            <input
              key={q}
              id="reviews-search"
              name="q"
              type="search"
              placeholder="Search by recipe name…"
              defaultValue={q}
            />
            <button type="submit" className="btn">
              Search
            </button>
          </form>

          <div className="reviews-page-toolbar">
            <p className="reviews-page-count" aria-live="polite">
              {data && !error && (
                <>
                  {pluralize(data.total, "review")}
                  {data.averageRating != null && (
                    <> · ★ {data.averageRating} average</>
                  )}
                </>
              )}
            </p>
            <label className="reviews-page-sort">
              Sort by{" "}
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p className="reviews-page-error" role="alert">
              {error}
            </p>
          ) : (
            <div
              className={loading ? "reviews-page-loading" : undefined}
              aria-busy={loading}
            >
              {data ? (
                <ReviewList reviews={data.reviews} />
              ) : (
                <p className="reviews-page-status">Loading reviews…</p>
              )}
            </div>
          )}

          {data && !error && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </div>
    </div>
  );
}
