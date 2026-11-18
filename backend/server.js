import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MongoStore from "connect-mongo";
import express from "express";
import session from "express-session";
import passport from "./auth/passport.js";
import { connect } from "./db/connection.js";
import { ensureReviewIndexes } from "./db/reviews.js";
import { ensureUserIndexes } from "./db/users.js";
import authRouter from "./routes/auth.js";
import recipesRouter from "./routes/recipes.js";
import reviewsRouter from "./routes/reviews.js";

// Render (and most hosts) assign the port through the PORT env var.
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";
// Built React app (npm run build in frontend/).
const distDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "frontend",
  "dist",
);

const app = express();

// Render terminates HTTPS at its proxy and forwards plain HTTP. Trusting the
// proxy lets Express see the original https request, which express-session
// requires before it will set the `secure` cookie below.
if (isProduction) app.set("trust proxy", 1);

app.use(express.json());

// Session must be registered before Passport so passport.session() can read it.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.DB_NAME,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/reviews", reviewsRouter);
// Unknown API paths get JSON, not the React app.
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Serve the React app. Any other path returns index.html so React Router
// handles it, which keeps a page refresh on e.g. /reviews/123 working.
app.use(express.static(distDir));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

try {
  await connect();
  await Promise.all([ensureUserIndexes(), ensureReviewIndexes()]);
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
