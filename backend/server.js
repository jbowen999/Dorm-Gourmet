import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import passport from "passport";
import { configurePassport } from "./auth/passport.js";
import { connectDb } from "./db/connection.js";
import { ensureReviewIndexes } from "./db/reviews.js";
import { ensureUserIndexes } from "./db/users.js";
import authRouter from "./routes/auth.js";
import recipesRouter from "./routes/recipes.js";
import reviewsRouter from "./routes/reviews.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "frontend", "dist");
const isProduction = process.env.NODE_ENV === "production";

const app = express();

if (isProduction) app.set("trust proxy", 1); // Render sits behind a proxy

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: isProduction },
  }),
);

configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Serve the built React app; React Router handles every non-API path.
app.use(express.static(distDir));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

// Express 5 forwards errors thrown in async handlers here.
app.use((err, _req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong" });
});

const port = Number(process.env.PORT) || 3000;

await connectDb();
await Promise.all([ensureUserIndexes(), ensureReviewIndexes()]);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
