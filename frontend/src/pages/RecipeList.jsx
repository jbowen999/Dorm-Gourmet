import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import EquipmentBadge from "../components/EquipmentBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import { EQUIPMENT, EQUIPMENT_VALUES } from "../constants/equipment.js";
import { pluralize } from "../utils/format.js";
import { toQueryString } from "../utils/query.js";
import "./RecipeList.css";

const KEYWORD_DEBOUNCE_MS = 300;

/**
 * Reads filters from the URL so views can be bookmarked, shared and navigated
 * back to. The search box uses `q` to match the home page and reviews page.
 */
function readParams(searchParams) {
  const equipment = searchParams.get("equipment");
  const page = Number(searchParams.get("page"));
  return {
    q: searchParams.get("q") ?? "",
    equipment: EQUIPMENT_VALUES.includes(equipment) ? equipment : "",
    maxPrepTime: searchParams.get("maxPrepTime") ?? "",
    maxCost: searchParams.get("maxCost") ?? "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

function formatCost(cost) {
  return cost == null ? "cost not listed" : `$${cost.toFixed(2)}`;
}

export default function RecipeList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readParams(searchParams);
  const { q, equipment, maxPrepTime, maxCost, page } = params;

  const requestQs = toQueryString({
    keyword: q,
    equipment,
    maxPrepTime,
    maxCost,
    page,
  });

  // The search box is edited locally and copied to the URL after a pause.
  // If q changes some other way (back button, Clear filters, a home page
  // link), pull it back into the box.
  const [keywordInput, setKeywordInput] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    setSyncedQ(q);
    setKeywordInput(q);
  }

  // The last finished request. While a new one is in flight, the previous
  // results stay on screen (dimmed) instead of flashing to a spinner.
  const [result, setResult] = useState({ qs: null, data: null, error: null });
  const loading = result.qs !== requestQs;
  const { data } = result;
  const error = loading ? null : result.error;

  useEffect(() => {
    const controller = new AbortController();
    api(`/api/recipes${requestQs}`, { signal: controller.signal })
      .then((data) => setResult({ qs: requestQs, data, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult((prev) => ({
          qs: requestQs,
          data: prev.data,
          error: "Couldn't load recipes. Please try again.",
        }));
      });
    return () => controller.abort();
  }, [requestQs]);

  /**
   * Merges changes into the URL. Any filter change goes back to page 1 and
   * replaces the history entry, so typing doesn't stack up Back presses.
   */
  function updateParams(changes, { resetPage = true } = {}) {
    const next = { ...params, ...changes };
    if (resetPage) next.page = 1;
    setSearchParams(
      toQueryString({
        q: next.q.trim(),
        equipment: next.equipment,
        maxPrepTime: next.maxPrepTime,
        maxCost: next.maxCost,
        page: next.page > 1 ? next.page : undefined,
      }).slice(1),
      { replace: resetPage },
    );
  }

  useEffect(() => {
    const trimmed = keywordInput.trim();
    if (trimmed === q) return;
    const timer = setTimeout(
      () => updateParams({ q: trimmed }),
      KEYWORD_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
    // updateParams is recreated each render; the timer only needs to restart
    // when the typed text or the applied q changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput, q]);

  function handlePageChange(nextPage) {
    updateParams({ page: nextPage }, { resetPage: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setKeywordInput("");
    updateParams({ q: "", equipment: "", maxPrepTime: "", maxCost: "" });
  }

  const hasFilters = Boolean(q || equipment || maxPrepTime || maxCost);

  return (
    <div className="recipe-list">
      <h1 className="recipe-list-title">Recipes</h1>

      <div className="recipe-list-body">
        <aside
          className="recipe-filters"
          aria-labelledby="recipe-filters-title"
        >
          <h2 id="recipe-filters-title" className="recipe-filters-title">
            Filters
          </h2>
          <label className="recipe-filters-field">
            Search
            <input
              type="search"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Title or ingredient…"
            />
          </label>
          <label className="recipe-filters-field">
            Equipment
            <select
              value={equipment}
              onChange={(e) => updateParams({ equipment: e.target.value })}
            >
              <option value="">Any</option>
              {EQUIPMENT.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="recipe-filters-field">
            Max prep time (minutes)
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={maxPrepTime}
              onChange={(e) => updateParams({ maxPrepTime: e.target.value })}
            />
          </label>
          <label className="recipe-filters-field">
            Max cost ($)
            <input
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              value={maxCost}
              onChange={(e) => updateParams({ maxCost: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            Clear filters
          </button>
        </aside>

        <section className="recipe-list-results" aria-label="Results">
          <p className="recipe-list-count" aria-live="polite">
            {data && !error && pluralize(data.totalCount, "recipe")}
          </p>

          {error ? (
            <p className="recipe-list-error" role="alert">
              {error}
            </p>
          ) : (
            <div
              className={loading ? "recipe-list-loading" : undefined}
              aria-busy={loading}
            >
              {!data ? (
                <p className="recipe-list-status">Loading recipes…</p>
              ) : data.recipes.length === 0 ? (
                <p className="recipe-list-status">
                  No recipes match your filters.
                </p>
              ) : (
                <ul className="recipe-cards">
                  {data.recipes.map((recipe) => (
                    <li key={recipe.id}>
                      <Link
                        to={`/recipes/${recipe.id}`}
                        className="recipe-card"
                      >
                        <h3 className="recipe-card-title">{recipe.title}</h3>
                        <p className="recipe-card-meta">
                          <EquipmentBadge value={recipe.equipment} />
                          <span>{recipe.prepTime} min</span>
                          <span>{formatCost(recipe.cost)}</span>
                        </p>
                        <p className="recipe-card-author">
                          by {recipe.ownerUsername ?? "unknown user"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
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
