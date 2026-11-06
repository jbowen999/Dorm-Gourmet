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

**Demo account:** username `demo` / password `TODO`. Seeded users share this password.

## Tech Stack

- **Frontend:** React (Hooks), React Router, PropTypes, Fetch API, CSS, Vite
- **Backend:** Node.js, Express, Passport (local strategy), express-session, bcryptjs
- **Database:** MongoDB with the native Node.js driver (no Mongoose)
- **Tooling:** ESLint, Prettier

## Project Structure

```
Dorm-Gourmet/
├── backend/            Express API + Passport auth
│   ├── db/             one module per MongoDB collection
│   ├── routes/         auth, recipes, reviews
│   ├── seed/           synthetic data scripts
│   └── package.json
├── frontend/           React app (Vite)
│   ├── src/
│   │   ├── components/ each component has a .jsx and a .css with the same name
│   │   └── pages/
│   └── package.json
├── docs/               design document and screenshots
└── LICENSE
```

## Build and Run Locally

### Prerequisites

- Node.js 22.9+
- A MongoDB connection string (local MongoDB or a MongoDB Atlas cluster)

### 1. Clone

```bash
git clone https://github.com/TODO/Dorm-Gourmet.git
cd Dorm-Gourmet
```

### 2. Configure the backend

Create `backend/.env`. It is gitignored, so never commit it.

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/
DB_NAME=dormGourmet
SESSION_SECRET=<any long random string>
PORT=3000
```

### 3. Install and seed

```bash
cd backend
npm install
npm run seed        # inserts users, ~1,000 recipes, and ~3,000 reviews
cd ../frontend
npm install
```

### 4. Run in development

Use two terminals:

```bash
# terminal 1
cd backend && npm run dev     # API on http://localhost:3000

# terminal 2
cd frontend && npm run dev    # app on http://localhost:5173 (proxies /api to :3000)
```

### 5. Production build

```bash
cd frontend && npm run build  # outputs frontend/dist
cd ../backend && npm start    # Express serves the API and frontend/dist
```

### Lint and format

```bash
npm run lint      # in backend/ or frontend/
npm run format    # Prettier
```

## License

[MIT](LICENSE)
