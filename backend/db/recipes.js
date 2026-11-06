// TODO(Jerith): recipes collection: list with filters, create, update, delete, indexes.
// See docs/DESIGN.md §6 and §7.
//
// getRecipeById is included now because the reviews API needs it to check that
// a review's recipeId exists. Keep its signature when you fill this module in.
import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

const recipes = () => getDb().collection("recipes");

export async function getRecipeById(id) {
  if (!ObjectId.isValid(id)) return null;
  return recipes().findOne({ _id: new ObjectId(id) });
}
