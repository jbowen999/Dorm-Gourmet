import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

export const EQUIPMENT = ["microwave", "hot-plate", "mini-fridge", "no-cook"];
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

// Sort orders for listRecipes. Each ends with newest-first, and _id breaks
// ties between equal createdAt values so pages never overlap. costMissing is
// computed in findWithOwner so recipes without a cost sort after priced ones.
export const RECIPE_SORTS = {
  newest: { createdAt: -1, _id: -1 },
  cheapest: { costMissing: 1, cost: 1, createdAt: -1, _id: -1 },
  fastest: { prepTime: 1, createdAt: -1, _id: -1 },
};

function recipes() {
  return getDb().collection("recipes");
}

function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Runs a match through the owner join. Only the owner's username is pulled
// from users, so password hashes never enter the pipeline. Paging happens
// before the join so only the returned page is looked up.
function findWithOwner(match, { skip = 0, limit, sort = "newest" } = {}) {
  const page = [{ $skip: skip }];
  if (limit !== undefined) page.push({ $limit: limit });
  return recipes()
    .aggregate([
      { $match: match },
      // Ascending sorts put null first in MongoDB, so flag missing costs.
      {
        $addFields: {
          costMissing: { $eq: [{ $ifNull: ["$cost", null] }, null] },
        },
      },
      { $sort: RECIPE_SORTS[sort] },
      ...page,
      {
        $lookup: {
          from: "users",
          localField: "ownerId",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 0, username: 1 } }],
          as: "owner",
        },
      },
      {
        $addFields: {
          ownerUsername: { $ifNull: [{ $first: "$owner.username" }, null] },
        },
      },
      { $project: { owner: 0, costMissing: 0 } },
    ])
    .toArray();
}

export async function createRecipe(data, ownerId) {
  const now = new Date();
  const result = await recipes().insertOne({
    ...data,
    ownerId: new ObjectId(ownerId),
    createdAt: now,
    updatedAt: now,
  });
  return getRecipe(result.insertedId);
}

export async function getRecipe(id) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const [recipe] = await findWithOwner({ _id });
  return recipe ?? null;
}

// page is 1-based and sort is a RECIPE_SORTS key. Returns the page of
// recipes plus the total number of recipes matching the filters across all
// pages.
export async function listRecipes({
  equipment,
  maxPrepTime,
  maxCost,
  keyword,
  page = 1,
  limit = DEFAULT_PAGE_LIMIT,
  sort = "newest",
} = {}) {
  const match = {};
  if (equipment) match.equipment = equipment;
  if (maxPrepTime !== undefined) match.prepTime = { $lte: maxPrepTime };
  // Recipes with no cost (null) are excluded once a cost cap is set.
  if (maxCost !== undefined) match.cost = { $lte: maxCost };
  if (keyword) {
    const pattern = { $regex: escapeRegex(keyword), $options: "i" };
    // Regex on an array field matches if any ingredient matches.
    match.$or = [{ title: pattern }, { ingredients: pattern }];
  }
  const [results, totalCount] = await Promise.all([
    findWithOwner(match, { skip: (page - 1) * limit, limit, sort }),
    recipes().countDocuments(match),
  ]);
  return { recipes: results, totalCount };
}

// Returns the updated recipe, or null if no recipe has that id.
export async function updateRecipe(id, data) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const result = await recipes().updateOne(
    { _id },
    { $set: { ...data, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) return null;
  return getRecipe(_id);
}

export async function deleteRecipe(id) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const result = await recipes().deleteOne({ _id });
  return result.deletedCount === 1;
}

export function isOwner(recipe, userId) {
  return (
    Boolean(recipe?.ownerId) &&
    userId != null &&
    recipe.ownerId.toString() === userId.toString()
  );
}

// Shape returned to clients: string ids instead of ObjectIds.
export function toPublicRecipe(recipe) {
  return {
    id: recipe._id.toString(),
    title: recipe.title,
    equipment: recipe.equipment,
    prepTime: recipe.prepTime,
    cost: recipe.cost,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    ownerId: recipe.ownerId.toString(),
    ownerUsername: recipe.ownerUsername,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}
