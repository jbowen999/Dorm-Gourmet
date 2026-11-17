import { Router } from "express";
import {
  DEFAULT_PAGE_LIMIT,
  EQUIPMENT,
  MAX_PAGE_LIMIT,
  createRecipe,
  deleteRecipe,
  getRecipe,
  isOwner,
  listRecipes,
  toPublicRecipe,
  updateRecipe,
} from "../db/recipes.js";

const router = Router();

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function isNonEmptyStringArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim() !== "")
  );
}

// Builds the stored recipe from only the known fields, so clients can't set
// ownerId, createdAt, etc. through the request body.
function validateRecipe(body = {}) {
  const errors = [];
  const { title, equipment, prepTime, ingredients, steps } = body;
  const cost = body.cost ?? null;

  if (typeof title !== "string" || title.trim() === "") {
    errors.push("title is required");
  }
  if (!EQUIPMENT.includes(equipment)) {
    errors.push(`equipment must be one of: ${EQUIPMENT.join(", ")}`);
  }
  if (
    typeof prepTime !== "number" ||
    !Number.isFinite(prepTime) ||
    prepTime <= 0
  ) {
    errors.push("prepTime must be a positive number");
  }
  if (
    cost !== null &&
    (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0)
  ) {
    errors.push("cost must be a non-negative number or null");
  }
  if (!isNonEmptyStringArray(ingredients)) {
    errors.push("ingredients must be a non-empty array of strings");
  }
  if (!isNonEmptyStringArray(steps)) {
    errors.push("steps must be a non-empty array of strings");
  }

  if (errors.length > 0) return { errors };
  return {
    data: {
      title: title.trim(),
      equipment,
      prepTime,
      cost,
      ingredients: ingredients.map((item) => item.trim()),
      steps: steps.map((step) => step.trim()),
    },
  };
}

function parseOptionalNumber(value) {
  if (value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

// Returns the default when absent, NaN when not a positive integer.
function parsePositiveInt(value, defaultValue) {
  if (value === undefined || value === "") return defaultValue;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : NaN;
}

// Loads the recipe and checks the logged-in user owns it; sends 404/403 otherwise.
async function loadOwnedRecipe(req, res) {
  const recipe = await getRecipe(req.params.id);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return null;
  }
  if (!isOwner(recipe, req.user._id)) {
    res.status(403).json({ error: "You can only modify your own recipes" });
    return null;
  }
  return recipe;
}

router.get("/", async (req, res) => {
  const { equipment, keyword } = req.query;
  const maxPrepTime = parseOptionalNumber(req.query.maxPrepTime);
  const maxCost = parseOptionalNumber(req.query.maxCost);

  if (equipment && !EQUIPMENT.includes(equipment)) {
    return res
      .status(400)
      .json({ error: `equipment must be one of: ${EQUIPMENT.join(", ")}` });
  }
  if (Number.isNaN(maxPrepTime) || Number.isNaN(maxCost)) {
    return res
      .status(400)
      .json({ error: "maxPrepTime and maxCost must be numbers" });
  }

  const page = parsePositiveInt(req.query.page, 1);
  const requestedLimit = parsePositiveInt(req.query.limit, DEFAULT_PAGE_LIMIT);
  if (Number.isNaN(page) || Number.isNaN(requestedLimit)) {
    return res
      .status(400)
      .json({ error: "page and limit must be positive integers" });
  }
  const limit = Math.min(requestedLimit, MAX_PAGE_LIMIT);

  const { recipes, totalCount } = await listRecipes({
    equipment,
    maxPrepTime,
    maxCost,
    keyword: typeof keyword === "string" ? keyword.trim() : undefined,
    page,
    limit,
  });
  res.json({
    recipes: recipes.map(toPublicRecipe),
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  });
});

router.get("/:id", async (req, res) => {
  const recipe = await getRecipe(req.params.id);
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json(toPublicRecipe(recipe));
});

router.post("/", requireAuth, async (req, res) => {
  const { data, errors } = validateRecipe(req.body);
  if (errors) {
    return res.status(400).json({ error: "Invalid recipe", details: errors });
  }
  const recipe = await createRecipe(data, req.user._id);
  res.status(201).json(toPublicRecipe(recipe));
});

router.put("/:id", requireAuth, async (req, res) => {
  if (!(await loadOwnedRecipe(req, res))) return;
  const { data, errors } = validateRecipe(req.body);
  if (errors) {
    return res.status(400).json({ error: "Invalid recipe", details: errors });
  }
  const recipe = await updateRecipe(req.params.id, data);
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json(toPublicRecipe(recipe));
});

router.delete("/:id", requireAuth, async (req, res) => {
  if (!(await loadOwnedRecipe(req, res))) return;
  await deleteRecipe(req.params.id);
  res.status(204).end();
});

export default router;
