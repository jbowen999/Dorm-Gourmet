import "dotenv/config";
import MongoStore from "connect-mongo";
import express from "express";
import session from "express-session";
import passport from "./auth/passport.js";
import { connect } from "./db/connection.js";
import { ensureUserIndexes } from "./db/users.js";
import authRouter from "./routes/auth.js";

const PORT = 3000;

const app = express();

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
      secure: process.env.NODE_ENV === "production",
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

try {
  await connect();
  await ensureUserIndexes();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
