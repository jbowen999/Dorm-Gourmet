import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

const reviews = () => getDb().collection("reviews");

export const REVIEW_SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  highest: { rating: -1, createdAt: -1, _id: -1 },
  lowest: { rating: 1, createdAt: -1, _id: -1 },
};

export const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

export async function ensureReviewIndexes() {
  await Promise.all([
    reviews().createIndex({ recipeId: 1, createdAt: -1 }),
    reviews().createIndex({ rating: 1 }),
    reviews().createIndex({ createdAt: -1 }),
    reviews().createIndex({ authorId: 1 }),
  ]);
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a MongoDB filter from already-validated query options. */
function buildFilter({ recipeId, q, equipment, minRating }) {
  const filter = {};
  if (recipeId) filter.recipeId = new ObjectId(recipeId);
  if (q) filter.recipeTitle = { $regex: escapeRegex(q), $options: "i" };
  if (equipment?.length) filter.equipmentUsed = { $in: equipment };
  if (minRating) filter.rating = { $gte: minRating };
  return filter;
}

/**
 * Lists reviews with filtering, sorting and pagination.
 * Returns { reviews, total, page, totalPages, averageRating } where
 * averageRating is over every matching review, not just the current page.
 */
export async function listReviews({
  recipeId,
  q,
  equipment,
  minRating,
  page = 1,
  limit = DEFAULT_LIMIT,
  sort = "newest",
}) {
  const filter = buildFilter({ recipeId, q, equipment, minRating });
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const safePage = Math.max(page, 1);

  const [result] = await reviews()
    .aggregate([
      { $match: filter },
      {
        $facet: {
          items: [
            { $sort: REVIEW_SORTS[sort] || REVIEW_SORTS.newest },
            { $skip: (safePage - 1) * safeLimit },
            { $limit: safeLimit },
          ],
          stats: [{ $group: { _id: null, total: { $sum: 1 }, avg: { $avg: "$rating" } } }],
        },
      },
    ])
    .toArray();

  const total = result.stats[0]?.total ?? 0;
  const avg = result.stats[0]?.avg;

  return {
    reviews: result.items,
    total,
    page: safePage,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    averageRating: avg == null ? null : Math.round(avg * 10) / 10,
  };
}

export async function getReviewById(id) {
  if (!ObjectId.isValid(id)) return null;
  return reviews().findOne({ _id: new ObjectId(id) });
}

export async function createReview({
  recipeId,
  recipeTitle,
  rating,
  comment,
  equipmentUsed,
  authorId,
  authorName,
}) {
  const now = new Date();
  const doc = {
    recipeId: new ObjectId(recipeId),
    recipeTitle,
    rating,
    comment,
    equipmentUsed,
    authorId: new ObjectId(authorId),
    authorName,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await reviews().insertOne(doc);
  return { _id: insertedId, ...doc };
}

/** Updates only the editable fields. Returns the updated document, or null. */
export async function updateReview(id, { rating, comment, equipmentUsed }) {
  return reviews().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { rating, comment, equipmentUsed, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function deleteReview(id) {
  const { deletedCount } = await reviews().deleteOne({ _id: new ObjectId(id) });
  return deletedCount === 1;
}
