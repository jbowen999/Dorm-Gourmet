// Generates ~3,000 synthetic reviews across the recipes already in the database.
// Run after recipes and users are seeded:  npm run seed:reviews
import { fileURLToPath } from "node:url";
import { EQUIPMENT } from "../constants.js";
import { closeDb, connectDb, getDb } from "../db/connection.js";
import { ensureReviewIndexes } from "../db/reviews.js";

const REVIEW_COUNT = 3000;
const MISMATCH_CHANCE = 0.15; // reviewer used different equipment than the recipe calls for

const COMMENTS = {
  5: [
    "Perfect. Making this again tomorrow.",
    "Came out exactly like the recipe said.",
    "Cheap, fast and actually tasty. Five stars.",
    "My roommate asked for the recipe.",
    "Best thing I've made in the dorm so far.",
  ],
  4: [
    "Really good. I added a little extra salt.",
    "Works great if you stir halfway through.",
    "Solid weeknight meal. Took a couple minutes longer than listed.",
    "Tasty. I'd double the sauce next time.",
  ],
  3: [
    "Not bad. A bit bland but easy.",
    "Fine for the price. Needed more seasoning.",
    "Okay. Texture was a little off.",
    "Decent, but the prep time was optimistic.",
  ],
  2: [
    "Didn't really work with my setup.",
    "Came out watery. Might try less liquid.",
    "Edges overcooked, middle still cold.",
  ],
  1: [
    "Did not work at all for me.",
    "Burned it following the times exactly.",
    "Would not make again.",
  ],
};

const MISMATCH_COMMENTS = [
  "I don't have the listed equipment, so I improvised. Did not go great.",
  "Tried this without the right equipment. Wouldn't recommend that.",
  "Adapted it for what I have. Edible, but not the same.",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Ratings skew positive; mismatched equipment skews low. */
function randomRating(mismatched) {
  const weights = mismatched ? [30, 35, 20, 10, 5] : [3, 7, 20, 35, 35];
  let roll = Math.random() * 100;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll < 0) return i + 1;
  }
  return 5;
}

function randomDateAfter(start) {
  const from = start ? new Date(start).getTime() : Date.now() - 365 * 864e5;
  return new Date(from + Math.random() * Math.max(Date.now() - from, 0));
}

function makeReview(recipe, user) {
  const recipeEquipment = recipe.equipment?.length ? recipe.equipment : ["no-cook"];
  const others = EQUIPMENT.filter((e) => !recipeEquipment.includes(e));
  const mismatched = others.length > 0 && Math.random() < MISMATCH_CHANCE;

  const rating = randomRating(mismatched);
  const createdAt = randomDateAfter(recipe.createdAt);
  const edited = Math.random() < 0.2;

  return {
    recipeId: recipe._id,
    recipeTitle: recipe.title,
    rating,
    comment: mismatched && rating <= 3 ? pick(MISMATCH_COMMENTS) : pick(COMMENTS[rating]),
    equipmentUsed: [mismatched ? pick(others) : pick(recipeEquipment)],
    authorId: user._id,
    authorName: user.username,
    createdAt,
    updatedAt: edited ? randomDateAfter(createdAt) : createdAt,
  };
}

export async function seedReviews() {
  const db = getDb();
  const recipes = await db
    .collection("recipes")
    .find({}, { projection: { title: 1, equipment: 1, createdAt: 1 } })
    .toArray();
  const users = await db
    .collection("users")
    .find({}, { projection: { username: 1 } })
    .toArray();

  if (recipes.length === 0 || users.length === 0) {
    throw new Error(
      `Need recipes and users before seeding reviews (found ${recipes.length} recipes, ${users.length} users).`,
    );
  }

  const docs = Array.from({ length: REVIEW_COUNT }, () =>
    makeReview(pick(recipes), pick(users)),
  );

  await db.collection("reviews").deleteMany({});
  await db.collection("reviews").insertMany(docs);
  await ensureReviewIndexes();
  console.log(`Seeded ${docs.length} reviews across ${recipes.length} recipes.`);
}

// Allow running this file directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await connectDb();
    await seedReviews();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
