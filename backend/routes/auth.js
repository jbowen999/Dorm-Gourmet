import { Router } from "express";
import passport from "../auth/passport.js";
import { createUser, findUserByUsername, toPublicUser } from "../db/users.js";

const MIN_PASSWORD_LENGTH = 8;
const DUPLICATE_KEY = 11000;

const router = Router();

router.post("/register", async (req, res, next) => {
  const username = req.body?.username?.trim();
  const password = req.body?.password;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
  }
  if (await findUserByUsername(username)) {
    return res.status(409).json({ error: "Username is already taken" });
  }

  let user;
  try {
    user = await createUser(username, password);
  } catch (err) {
    // Unique index catches a concurrent registration that slipped past the check above.
    if (err.code === DUPLICATE_KEY) {
      return res.status(409).json({ error: "Username is already taken" });
    }
    return next(err);
  }

  req.login(user, (err) => {
    if (err) return next(err);
    res.status(201).json(toPublicUser(user));
  });
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res
        .status(401)
        .json({ error: info?.message || "Invalid username or password" });
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json(toPublicUser(user));
    });
  })(req, res, next);
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
});

router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json(toPublicUser(req.user));
});

export default router;
