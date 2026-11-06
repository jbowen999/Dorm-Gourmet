import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import EquipmentBadge from "../components/EquipmentBadge.jsx";
import StarRating from "../components/StarRating.jsx";
import { EQUIPMENT } from "../constants/equipment.js";
import "./HomePage.css";

const STEPS = [
  { title: "Pick your equipment", text: "Microwave, hot plate, mini-fridge, or nothing." },
  { title: "Set time and budget", text: "Filter by max prep time and cost." },
  { title: "Check the reviews", text: "See if it worked for someone with your setup." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [recentError, setRecentError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/reviews?limit=3&sort=newest", { signal: controller.signal })
      .then((data) => setRecent(data.reviews))
      .catch((err) => {
        if (err.name !== "AbortError") setRecentError(true);
      });
    return () => controller.abort();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/recipes?q=${encodeURIComponent(q)}` : "/recipes");
  }

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">Real recipes for a microwave, a hot plate, or a mini-fridge.</h1>

        <form className="home-search" role="search" onSubmit={handleSearch}>
          <label htmlFor="home-search-input" className="visually-hidden">
            Search recipes
          </label>
          <input
            id="home-search-input"
            type="search"
            placeholder="Search recipes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>

        <h2 className="home-equipment-title">What do you have?</h2>
        <ul className="home-equipment">
          {EQUIPMENT.map(({ value, label, icon }) => (
            <li key={value}>
              <Link className="home-equipment-link" to={`/recipes?equipment=${value}`}>
                <span aria-hidden="true">{icon}</span> {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-steps" aria-labelledby="home-steps-title">
        <h2 id="home-steps-title">How it works</h2>
        <ol>
          {STEPS.map(({ title, text }) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="home-recent-title">
        <div className="home-recent-header">
          <h2 id="home-recent-title">Recently reviewed</h2>
          <Link to="/reviews">All reviews ›</Link>
        </div>

        {recentError && <p>Couldn&apos;t load recent reviews.</p>}
        {!recentError && recent.length === 0 && <p>No reviews yet.</p>}

        <ul className="home-recent">
          {recent.map((review) => (
            <li key={review._id} className="home-recent-card">
              <Link to={`/reviews/${review._id}`} className="home-recent-title">
                {review.recipeTitle}
              </Link>
              <StarRating rating={review.rating} />
              <p className="home-recent-comment">“{review.comment}”</p>
              <div className="home-recent-meta">
                {review.equipmentUsed.map((e) => (
                  <EquipmentBadge key={e} value={e} />
                ))}
                <span>by {review.authorName}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
