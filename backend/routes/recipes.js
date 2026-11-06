// TODO(Jerith): recipes CRUD. See docs/DESIGN.md §7.
import { Router } from "express";
import { getRecipeById } from "../db/recipes.js";

const router = Router();

const notImplemented = (_req, res) =>
  res.status(501).json({ error: "Not implemented yet" });

router.get("/", notImplemented);

router.get("/:id", async (req, res) => {
  const recipe = await getRecipeById(req.params.id);
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  res.json(recipe);
});

router.post("/", notImplemented);
router.put("/:id", notImplemented);
router.delete("/:id", notImplemented);

export default router;
