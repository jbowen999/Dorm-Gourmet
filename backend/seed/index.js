// Seeds everything in dependency order: users + recipes first, then reviews.
import { closeDb, connectDb } from "../db/connection.js";
import { seedRecipes } from "./seedRecipes.js";
import { seedReviews } from "./seedReviews.js";

try {
  await connectDb();
  await seedRecipes();
  await seedReviews();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await closeDb();
}
