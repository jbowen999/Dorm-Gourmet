import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import { connect } from "./db/connection.js";

const PORT = 3000;

const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

try {
  await connect();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
