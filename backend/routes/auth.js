// TODO(Jerith): register, login and logout. See docs/DESIGN.md §7.
import { Router } from "express";

const router = Router();

const notImplemented = (_req, res) =>
  res.status(501).json({ error: "Not implemented yet" });

router.post("/register", notImplemented);
router.post("/login", notImplemented);
router.post("/logout", notImplemented);

router.get("/me", (req, res) => {
  res.json(req.user ? { _id: req.user._id, username: req.user.username } : null);
});

export default router;
