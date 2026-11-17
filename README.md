# Dorm Gourmet

Recipes for dorm-kitchen cooking: a microwave, a hot plate, a mini-fridge, or nothing at all.

![Dorm Gourmet screenshot](docs/screenshot.png)
<!-- TODO: add docs/screenshot.png once the UI is built -->

## Authors

- **Jerith Gurusubburam**: Recipes section, authentication
- **Julian Bowen**: Reviews section, navigation, home page

## Class

[CS5610 Web Development, Northeastern University](TODO-class-link), taught by Prof. John Alexis Guerra Gómez

## Links

- **Live site:** TODO
- **Demo video:** TODO
- **Slides:** TODO
- **Design document:** [docs/DESIGN.md](docs/DESIGN.md)

## Project Objective

General recipe sites assume a full kitchen. A student with only a microwave or a hot plate has no reliable way to filter out recipes they can't make. Dorm Gourmet fixes that with two sections:

- **Recipes.** Every recipe is tagged with the equipment it needs, its prep time, and its estimated cost, so you can find something you can make tonight.
- **Reviews.** Students who tried a recipe report which equipment they used and how it went, so you can confirm it works with your setup before you buy ingredients.

Anyone can browse and search. Registered users can post recipes and reviews and edit or delete their own.

## How to Use

1. **Find a recipe.** Go to **Recipes**, check the equipment you have, and set a max prep time and cost. Type a keyword to narrow the results.
2. **Read it.** Open a recipe to see ingredients, steps, cost, author, and last-updated date. Reviews from other students appear below.
3. **Check reviews for your setup.** On a recipe page or on **Reviews**, filter by equipment used and minimum rating.
4. **Contribute.** Click **Sign up** to create an account. Then you can:
   - post a recipe with **+ New Recipe**
   - review a recipe with **+ Write a review** on its page
   - edit or delete your own posts from their detail pages

**Demo accounts:** the seed script creates eight users (for example `seed_ramen_ronin` or `seed_hotplate_hero`), all with the password `seed-password-123`.

## Tech Stack

- **Frontend:** React 19 (Hooks), React Router 7, PropTypes, Fetch API, CSS, Vite
- **Backend:** Node.js, Express 5, Passport (local strategy), express-session with a MongoDB session store (`connect-mongo`), bcryptjs
- **Database:** MongoDB with the native Node.js driver (no Mongoose)
- **Tooling:** ESLint, Prettier, nodemon

## Project Structure

```
Dorm-Gourmet/
├── backend/              Express API + Passport auth
│   ├── auth/             Passport local strategy
│   ├── db/               one module per MongoDB collection
│   ├── middleware/       requireAuth / ownership helpers
│   ├── routes/           auth, recipes, reviews
│   ├── seed.js           seed users + ~1,200 recipes
│   ├── seedReviews.js    ~3,000 reviews over the seeded recipes
│   └── package.json
├── frontend/             React app (Vite)
│   ├── src/
│   │   ├── components/   each component has a .jsx and a .css with the same name
│   │   └── pages/
│   └── package.json
├── docs/                 design document and screenshots
└── LICENSE
```

## Build and Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm
- A MongoDB instance (local or Atlas)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

Copy the example env file and fill in your values. `.env` is gitignored, so never commit it.

```bash
cd backend
cp .env.example .env
```

| Variable         | Description                              |
| ---------------- | ---------------------------------------- |
| `MONGO_URI`      | MongoDB connection string                |
| `DB_NAME`        | Name of the database to use              |
| `SESSION_SECRET` | Long random string used to sign sessions |

### 3. Seed the database

```bash
cd backend
npm run seed           # seed users + ~1,200 recipes (replaces earlier seed data)
npm run seed:reviews   # ~3,000 reviews across those recipes (replaces all reviews)
```

Run `seed:reviews` again after re-running `seed`, since re-seeding replaces the recipes the reviews point to.

### 4. Run both dev servers

Use two terminals:

```bash
# Terminal 1: backend (http://localhost:3000, auto-restarts via nodemon)
cd backend
npm run dev
```

```bash
# Terminal 2: frontend (Vite, http://localhost:5173)
cd frontend
npm run dev
```

The Vite dev server proxies any `/api` request to the backend on port 3000, so the frontend calls the API with plain `fetch("/api/...")`. Visit http://localhost:5173/api/health to check that the backend is reachable through the proxy.

### Linting & formatting

Each half has its own ESLint flat config (`eslint.config.js`) and Prettier. Run these from inside `backend/` or `frontend/`:

```bash
npm run lint      # ESLint (frontend includes React + Hooks rules)
npm run format    # Prettier, rewrites files in place
```

## License

[MIT](LICENSE)
