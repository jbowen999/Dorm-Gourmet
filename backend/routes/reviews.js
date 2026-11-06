import { Router } from "express";
import { ObjectId } from "mongodb";
import { EQUIPMENT } from "../constants.js";
import { getRecipeById } from "../db/recipes.js";
import {
  REVIEW_SORTS,
  createReview,
  deleteReview,
  getReviewById,
  listReviews,
  updateReview,
} from "../db/reviews.js";
import { isOwner, requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const MAX_COMMENT_LENGTH = 2000;

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Parses "microwave,hot-plate" into a list of known equipment values. */
function parseEquipmentList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => EQUIPMENT.includes(s));
}

/** Validates the editable fields of a review. Returns { errors, values }. */
function validateReviewBody(body) {
  const errors = {};
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Rating must be a whole number from 1 to 5.";
  }

  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (!comment) errors.comment = "Comment is required.";
  else if (comment.length > MAX_COMMENT_LENGTH) {
    errors.comment = `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`;
  }

  const equipmentUsed = Array.isArray(body.equipmentUsed)
    ? [...new Set(body.equipmentUsed)]
    : [];
  if (equipmentUsed.length === 0) {
    errors.equipmentUsed = "Pick the equipment you used.";
  } else if (!equipmentUsed.every((e) => EQUIPMENT.includes(e))) {
    errors.equipmentUsed = `Equipment must be one of: ${EQUIPMENT.join(", ")}.`;
  }

  return { errors, values: { rating, comment, equipmentUsed } };
}

const hasErrors = (errors) => Object.keys(errors).length > 0;

// GET /api/reviews?recipeId&q&equipment&minRating&page&limit&sort
router.get("/", async (req, res) => {
  const { recipeId, q, equipment, minRating, page, limit, sort } = req.query;

  if (recipeId && !ObjectId.isValid(recipeId)) {
    return res.status(400).json({ error: "Invalid recipeId" });
  }

  const rating = toPositiveInt(minRating, undefined);
  const result = await listReviews({
    recipeId,
    q: typeof q === "string" ? q.trim() : undefined,
    equipment: parseEquipmentList(equipment),
    minRating: rating && rating <= 5 ? rating : undefined,
    page: toPositiveInt(page, 1),
    limit: toPositiveInt(limit, undefined),
    sort: sort in REVIEW_SORTS ? sort : "newest",
  });
  res.json(result);
});

// GET /api/reviews/:id
router.get("/:id", async (req, res) => {
  const review = await getReviewById(req.params.id);
  if (!review) return res.status(404).json({ error: "Review not found" });

  // Reviews outlive deleted recipes; tell the client so it can say so.
  const recipe = await getRecipeById(review.recipeId);
  res.json({ ...review, recipeExists: Boolean(recipe) });
});

// POST /api/reviews
router.post("/", requireAuth, async (req, res) => {
  const { errors, values } = validateReviewBody(req.body ?? {});
  const recipe = await getRecipeById(req.body?.recipeId);
  if (!recipe) errors.recipeId = "That recipe does not exist.";
  if (hasErrors(errors)) return res.status(400).json({ error: "Invalid review", errors });

  const review = await createReview({
    ...values,
    recipeId: recipe._id,
    recipeTitle: recipe.title,
    authorId: req.user._id,
    authorName: req.user.username,
  });
  res.status(201).json(review);
});

// PUT /api/reviews/:id
router.put("/:id", requireAuth, async (req, res) => {
  const existing = await getReviewById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Review not found" });
  if (!isOwner(req, existing)) {
    return res.status(403).json({ error: "You can only edit your own reviews." });
  }

  const { errors, values } = validateReviewBody(req.body ?? {});
  if (hasErrors(errors)) return res.status(400).json({ error: "Invalid review", errors });

  res.json(await updateReview(req.params.id, values));
});

// DELETE /api/reviews/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await getReviewById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Review not found" });
  if (!isOwner(req, existing)) {
    return res.status(403).json({ error: "You can only delete your own reviews." });
  }

  await deleteReview(req.params.id);
  res.status(204).end();
});

export default router;
