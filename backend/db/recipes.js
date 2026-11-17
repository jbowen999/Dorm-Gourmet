import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

export const EQUIPMENT = ["microwave", "hot-plate", "mini-fridge", "no-cook"];

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
// from users, so password hashes never enter the pipeline.
function findWithOwner(match, sort = { createdAt: -1 }) {
  return recipes()
    .aggregate([
      { $match: match },
      { $sort: sort },
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
      { $project: { owner: 0 } },
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

export async function listRecipes({
  equipment,
  maxPrepTime,
  maxCost,
  keyword,
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
  return findWithOwner(match);
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
