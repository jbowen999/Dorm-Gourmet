// Replaces all demo data: deletes seeded users and their recipes, then
// recreates them. Real (non-seeded) users and their recipes are untouched.
import "dotenv/config";
import { close, connect, getDb } from "./db/connection.js";
import { EQUIPMENT } from "./db/recipes.js";
import { createUser, ensureUserIndexes } from "./db/users.js";

const RECIPE_COUNT = 1200;
const SEED_PASSWORD = "seed-password-123";
const NULL_COST_RATE = 0.15;
const HISTORY_DAYS = 180;
// Share of each equipment type's recipes posted by users whose primary
// equipment it is; the rest go to anyone else, for a little variety.
const PRIMARY_OWNER_RATE = 0.85;
// Chance a user with a favourite dish posts it, when the equipment matches.
const FAVORITE_DISH_RATE = 0.6;

// Two users per equipment type keeps the per-user counts balanced.
const SEED_USERS = [
  { username: "seed_ramen_ronin", equipment: "microwave", favorite: "Ramen" },
  { username: "seed_mug_master", equipment: "microwave", favorite: "Mug Cake" },
  { username: "seed_hotplate_hero", equipment: "hot-plate" },
  { username: "seed_dining_hall_dropout", equipment: "hot-plate" },
  { username: "seed_fridge_raider", equipment: "mini-fridge" },
  { username: "seed_budget_chef", equipment: "mini-fridge" },
  { username: "seed_nocook_nina", equipment: "no-cook" },
  { username: "seed_midnight_snacker", equipment: "no-cook" },
];

// Deterministic PRNG so every run produces the same dataset.
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(20261116);
const pick = (items) => items[Math.floor(random() * items.length)];
const intBetween = (min, max) => min + Math.floor(random() * (max - min + 1));
const floatBetween = (min, max) => min + random() * (max - min);

// A variation adds a name prefix, an extra ingredient, a final step, and
// addCost on top of the dish's base cost (protein and specialty add-ins cost more).
// Each dish lists only the variations that make sense for it.
const VARIATIONS = {
  classic: { addCost: [0, 0], prefix: "Classic" },
  finals: {
    addCost: [0, 0],
    prefix: "Finals Week",
    step: "Eat at your desk. You've got this.",
  },
  spicy: {
    addCost: [0.1, 0.25],
    prefix: "Spicy",
    ingredient: "1 tsp sriracha",
    step: "Finish with sriracha to taste.",
  },
  garlic: {
    addCost: [0.1, 0.25],
    prefix: "Garlic",
    ingredient: "1 clove garlic, minced",
    step: "Stir in the garlic.",
  },
  cheesy: {
    addCost: [1, 2],
    prefix: "Extra-Cheesy",
    ingredient: "1/4 cup shredded cheese",
    step: "Top with the extra cheese.",
  },
  veggie: {
    addCost: [1, 2],
    prefix: "Veggie-Loaded",
    ingredient: "1/2 cup spinach",
    step: "Add the spinach.",
  },
  green: {
    addCost: [1, 2],
    prefix: "Green",
    ingredient: "handful of spinach",
    step: "Add the spinach before the final shake.",
  },
  eggDrop: {
    addCost: [0.25, 0.5],
    prefix: "Egg-Drop",
    ingredient: "1 egg, beaten",
    step: "Stir in the beaten egg and microwave 30 seconds more.",
  },
  peanutSauce: {
    addCost: [0.25, 0.5],
    prefix: "Peanut",
    ingredient: "1 tbsp peanut butter",
    step: "Stir in the peanut butter until it forms a sauce.",
  },
  peanutButter: {
    addCost: [0.25, 0.5],
    prefix: "Peanut Butter",
    ingredient: "1 tbsp peanut butter",
    step: "Add a spoonful of peanut butter.",
  },
  chocolateChip: {
    addCost: [0.5, 1],
    prefix: "Chocolate Chip",
    ingredient: "2 tbsp chocolate chips",
    step: "Scatter the chocolate chips on top.",
  },
  cinnamon: {
    addCost: [0.1, 0.25],
    prefix: "Cinnamon",
    ingredient: "1/2 tsp cinnamon",
    step: "Dust with cinnamon.",
  },
  honey: {
    addCost: [0.25, 0.5],
    prefix: "Honey",
    ingredient: "1 tbsp honey",
    step: "Drizzle with honey.",
  },
  hotHoney: {
    addCost: [0.25, 0.5],
    prefix: "Hot Honey",
    ingredient: "1 tbsp honey mixed with chili flakes",
    step: "Drizzle with the hot honey.",
  },
  honeySoy: {
    addCost: [0.25, 0.5],
    prefix: "Honey Soy",
    ingredient: "1 tbsp honey",
    step: "Stir the honey into the sauce.",
  },
  bagel: {
    addCost: [0.5, 1],
    prefix: "Everything Bagel",
    ingredient: "1 tsp everything bagel seasoning",
    step: "Sprinkle with the seasoning.",
  },
  lemonHerb: {
    addCost: [0.5, 1],
    prefix: "Lemon Herb",
    ingredient: "juice of 1/2 lemon",
    step: "Squeeze lemon over the top.",
  },
  herb: {
    addCost: [0.25, 0.5],
    prefix: "Herby",
    ingredient: "1 tsp dried chives",
    step: "Sprinkle with chives.",
  },
  balsamic: {
    addCost: [2, 3],
    prefix: "Balsamic",
    ingredient: "1 tbsp balsamic glaze",
    step: "Drizzle with balsamic glaze.",
  },
  chicken: {
    addCost: [3, 5],
    prefix: "Chicken",
    ingredient: "1/2 cup diced cooked chicken",
    step: "Add the chicken and heat through.",
  },
  chickenCold: {
    addCost: [3, 5],
    prefix: "Chicken",
    ingredient: "1/2 cup diced cooked chicken",
    step: "Toss in the chicken.",
  },
  protein: {
    addCost: [2, 3],
    prefix: "Protein-Packed",
    ingredient: "1 scoop protein powder",
    step: "Mix in the protein powder.",
  },
};

// cost is the base price range in dollars before the variation's addCost.
// prepTime is hands-on time plus short waits; overnight or multi-hour chilling
// is described in the steps but not counted.
const DISHES = {
  microwave: [
    {
      name: "Ramen",
      prepTime: [5, 10],
      cost: [1, 3],
      ingredients: ["1 pack instant ramen", "2 cups water", "seasoning packet"],
      steps: [
        "Break the noodles into a large microwave-safe bowl.",
        "Cover with water and microwave for 3-4 minutes.",
        "Stir in the seasoning and let sit for 1 minute.",
      ],
      variations: [
        "classic",
        "finals",
        "spicy",
        "garlic",
        "eggDrop",
        "peanutSauce",
        "veggie",
        "cheesy",
      ],
    },
    {
      name: "Mug Cake",
      prepTime: [5, 10],
      cost: [1, 3],
      ingredients: [
        "4 tbsp flour",
        "3 tbsp sugar",
        "2 tbsp cocoa powder",
        "3 tbsp milk",
        "2 tbsp vegetable oil",
      ],
      steps: [
        "Whisk the dry ingredients together in a large mug.",
        "Stir in the milk and oil until smooth.",
        "Microwave for 70-90 seconds until set in the middle.",
      ],
      variations: [
        "classic",
        "finals",
        "chocolateChip",
        "peanutButter",
        "cinnamon",
      ],
    },
    {
      name: "Mac and Cheese",
      prepTime: [8, 15],
      cost: [2, 4],
      ingredients: [
        "1/2 cup elbow macaroni",
        "1/2 cup water",
        "1/4 cup milk",
        "1/2 cup shredded cheddar",
      ],
      steps: [
        "Combine pasta and water in a large mug.",
        "Microwave in 1-minute bursts, stirring, until the pasta is tender.",
        "Stir in milk and cheese, then microwave 30 seconds more.",
      ],
      variations: [
        "classic",
        "finals",
        "cheesy",
        "spicy",
        "garlic",
        "bagel",
        "veggie",
        "chicken",
      ],
    },
    {
      name: "Scrambled Eggs",
      prepTime: [5, 8],
      cost: [1, 3],
      ingredients: ["2 eggs", "2 tbsp milk", "pinch of salt"],
      steps: [
        "Whisk eggs, milk and salt in a greased mug.",
        "Microwave 45 seconds, stir, then 30 seconds more.",
      ],
      variations: ["classic", "cheesy", "spicy", "herb", "veggie", "bagel"],
    },
    {
      name: "Baked Potato",
      prepTime: [10, 15],
      cost: [1, 3],
      ingredients: ["1 russet potato", "1 tbsp butter", "salt and pepper"],
      steps: [
        "Scrub the potato and poke it several times with a fork.",
        "Microwave 5 minutes, flip, then 3-4 minutes more.",
        "Split open and top with butter, salt and pepper.",
      ],
      variations: [
        "classic",
        "cheesy",
        "spicy",
        "garlic",
        "herb",
        "chicken",
        "bagel",
      ],
    },
    {
      name: "Quesadilla",
      prepTime: [5, 8],
      cost: [2, 4],
      ingredients: [
        "2 flour tortillas",
        "1/2 cup shredded cheese",
        "2 tbsp salsa",
      ],
      steps: [
        "Sprinkle cheese over one tortilla and top with the other.",
        "Microwave on a plate for 45-60 seconds until melted.",
        "Cut into wedges and serve with salsa.",
      ],
      variations: ["classic", "finals", "spicy", "cheesy", "veggie", "chicken"],
    },
  ],
  "hot-plate": [
    {
      name: "Stir Fry",
      prepTime: [15, 30],
      cost: [3, 6],
      ingredients: [
        "1 cup frozen mixed vegetables",
        "1 cup cooked rice",
        "2 tbsp soy sauce",
        "1 tbsp oil",
      ],
      steps: [
        "Heat oil in a skillet over medium-high heat.",
        "Cook the vegetables for 4-5 minutes, stirring often.",
        "Add rice and soy sauce and toss until heated through.",
      ],
      variations: [
        "classic",
        "spicy",
        "garlic",
        "peanutSauce",
        "honeySoy",
        "chicken",
        "veggie",
      ],
    },
    {
      name: "Fried Rice",
      prepTime: [15, 25],
      cost: [2, 4],
      ingredients: [
        "1 cup day-old rice",
        "1 egg",
        "2 green onions",
        "1 tbsp soy sauce",
        "1 tbsp oil",
      ],
      steps: [
        "Heat oil in a skillet and scramble the egg, then push it aside.",
        "Add rice and fry until it starts to crisp.",
        "Stir in soy sauce and green onions.",
      ],
      variations: ["classic", "finals", "spicy", "garlic", "chicken", "veggie"],
    },
    {
      name: "Grilled Cheese",
      prepTime: [10, 15],
      cost: [2, 4],
      ingredients: ["2 slices bread", "2 slices cheddar", "1 tbsp butter"],
      steps: [
        "Butter the outside of each slice of bread.",
        "Assemble with cheese in the middle.",
        "Cook in a skillet over medium heat, 2-3 minutes per side.",
      ],
      variations: [
        "classic",
        "finals",
        "spicy",
        "garlic",
        "hotHoney",
        "bagel",
        "veggie",
      ],
    },
    {
      name: "Pasta",
      prepTime: [15, 25],
      cost: [3, 5],
      ingredients: [
        "4 oz spaghetti",
        "1/2 cup marinara sauce",
        "grated parmesan",
      ],
      steps: [
        "Boil the pasta in salted water until al dente.",
        "Drain, then stir in the marinara over low heat.",
        "Top with parmesan.",
      ],
      variations: [
        "classic",
        "finals",
        "spicy",
        "garlic",
        "cheesy",
        "lemonHerb",
        "veggie",
        "chicken",
      ],
    },
    {
      name: "Pancakes",
      prepTime: [15, 25],
      cost: [2, 4],
      ingredients: [
        "1 cup pancake mix",
        "3/4 cup water",
        "maple syrup",
        "1 tsp butter",
      ],
      steps: [
        "Whisk pancake mix and water until just combined.",
        "Melt butter in a skillet over medium heat.",
        "Cook 1/4-cup scoops until bubbles form, then flip.",
      ],
      variations: [
        "classic",
        "chocolateChip",
        "peanutButter",
        "cinnamon",
        "protein",
      ],
    },
    {
      name: "Egg Fried Noodles",
      prepTime: [10, 20],
      cost: [1, 3],
      ingredients: [
        "1 pack instant noodles",
        "1 egg",
        "1 tbsp soy sauce",
        "1 tbsp oil",
      ],
      steps: [
        "Boil the noodles for 2 minutes and drain.",
        "Fry in oil with soy sauce for 2 minutes.",
        "Push aside, scramble the egg, then toss together.",
      ],
      variations: [
        "classic",
        "finals",
        "spicy",
        "garlic",
        "peanutSauce",
        "veggie",
      ],
    },
  ],
  "mini-fridge": [
    {
      name: "Overnight Oats",
      prepTime: [5, 10],
      cost: [2, 4],
      ingredients: [
        "1/2 cup rolled oats",
        "1/2 cup milk",
        "1/4 cup yogurt",
        "1 tbsp honey",
      ],
      steps: [
        "Combine oats, milk, yogurt and honey in a jar.",
        "Stir well, seal and refrigerate overnight.",
      ],
      variations: [
        "classic",
        "finals",
        "chocolateChip",
        "peanutButter",
        "cinnamon",
        "protein",
      ],
    },
    {
      name: "Yogurt Parfait",
      prepTime: [5, 8],
      cost: [3, 6],
      ingredients: ["1 cup Greek yogurt", "1/2 cup granola", "1/2 cup berries"],
      steps: [
        "Layer yogurt, granola and berries in a cup.",
        "Repeat the layers and chill until ready to eat.",
      ],
      variations: [
        "classic",
        "honey",
        "chocolateChip",
        "peanutButter",
        "cinnamon",
        "protein",
      ],
    },
    {
      name: "Pasta Salad",
      prepTime: [35, 45],
      cost: [4, 6],
      ingredients: [
        "1 cup cooked rotini",
        "1/4 cup Italian dressing",
        "1/2 cup cherry tomatoes",
        "1/4 cup cubed mozzarella",
      ],
      steps: [
        "Toss the pasta with dressing, tomatoes and mozzarella.",
        "Refrigerate for at least 30 minutes before eating.",
      ],
      variations: [
        "classic",
        "lemonHerb",
        "garlic",
        "spicy",
        "veggie",
        "chickenCold",
        "balsamic",
      ],
    },
    {
      name: "Chia Pudding",
      prepTime: [5, 10],
      cost: [3, 6],
      ingredients: [
        "3 tbsp chia seeds",
        "3/4 cup milk",
        "1 tsp vanilla",
        "1 tbsp maple syrup",
      ],
      steps: [
        "Stir chia seeds, milk, vanilla and syrup together in a jar.",
        "Stir again after 5 minutes, then refrigerate for 2 hours.",
      ],
      variations: [
        "classic",
        "chocolateChip",
        "peanutButter",
        "cinnamon",
        "protein",
      ],
    },
    {
      name: "Smoothie Jar",
      prepTime: [12, 18],
      cost: [3, 6],
      ingredients: [
        "1 banana",
        "1/2 cup frozen berries",
        "1 cup milk",
        "2 tbsp peanut butter",
      ],
      steps: [
        "Mash the banana in a large jar.",
        "Add the remaining ingredients, seal and shake hard.",
        "Chill 10 minutes and shake again before drinking.",
      ],
      variations: ["classic", "finals", "honey", "green", "protein"],
    },
    {
      name: "Cucumber Salad",
      prepTime: [20, 25],
      cost: [2, 4],
      ingredients: [
        "1 cucumber",
        "2 tbsp rice vinegar",
        "1 tsp sesame oil",
        "pinch of salt",
      ],
      steps: [
        "Thinly slice the cucumber.",
        "Toss with vinegar, sesame oil and salt.",
        "Chill for 15 minutes.",
      ],
      variations: ["classic", "spicy", "garlic", "bagel"],
    },
  ],
  "no-cook": [
    {
      name: "Wrap",
      prepTime: [5, 10],
      cost: [4, 7],
      ingredients: [
        "1 large tortilla",
        "3 slices deli turkey",
        "1 slice cheese",
        "handful of lettuce",
      ],
      steps: [
        "Lay out the tortilla and layer the fillings in the center.",
        "Fold in the sides and roll up tightly.",
      ],
      variations: ["classic", "finals", "spicy", "veggie", "bagel"],
    },
    {
      name: "PB&J",
      prepTime: [5, 5],
      cost: [1, 3],
      ingredients: ["2 slices bread", "2 tbsp peanut butter", "1 tbsp jam"],
      steps: [
        "Spread peanut butter on one slice and jam on the other.",
        "Press together and cut diagonally.",
      ],
      variations: ["classic", "finals", "honey", "chocolateChip"],
    },
    {
      name: "Hummus Plate",
      prepTime: [5, 10],
      cost: [3, 6],
      ingredients: ["1/2 cup hummus", "1 pita", "baby carrots", "1/2 cucumber"],
      steps: [
        "Cut the pita into triangles and slice the cucumber.",
        "Arrange everything around a bowl of hummus.",
      ],
      variations: ["classic", "spicy", "garlic", "lemonHerb", "bagel"],
    },
    {
      name: "Caprese Salad",
      prepTime: [5, 10],
      cost: [8, 12],
      ingredients: [
        "1 tomato",
        "4 oz fresh mozzarella",
        "fresh basil",
        "1 tbsp olive oil",
      ],
      steps: [
        "Slice the tomato and mozzarella.",
        "Alternate slices on a plate with basil leaves.",
        "Drizzle with olive oil.",
      ],
      variations: ["classic", "balsamic", "garlic"],
    },
    {
      name: "Snack Box",
      prepTime: [5, 10],
      cost: [3, 6],
      ingredients: [
        "crackers",
        "1 oz cheese cubes",
        "1 apple",
        "handful of almonds",
      ],
      steps: [
        "Slice the apple.",
        "Arrange everything in a container with compartments.",
      ],
      variations: ["classic", "finals", "peanutButter", "chocolateChip"],
    },
    {
      name: "Rice Cake Stack",
      prepTime: [5, 5],
      cost: [1, 3],
      ingredients: ["2 rice cakes", "2 tbsp peanut butter", "1 banana"],
      steps: [
        "Spread peanut butter on each rice cake.",
        "Top with banana slices.",
      ],
      variations: ["classic", "honey", "chocolateChip", "cinnamon"],
    },
  ],
};

const MIN_COST = 1;
const MAX_COST = 15;

function priceFor(dish, variation) {
  const price = floatBetween(...dish.cost) + floatBetween(...variation.addCost);
  const clamped = Math.min(MAX_COST, Math.max(MIN_COST, price));
  return Math.round(clamped * 100) / 100;
}

function pickOwner(equipment, seedUsers) {
  const primaries = seedUsers.filter((u) => u.equipment === equipment);
  const others = seedUsers.filter((u) => u.equipment !== equipment);
  return random() < PRIMARY_OWNER_RATE ? pick(primaries) : pick(others);
}

function pickDish(equipment, owner) {
  const dishes = DISHES[equipment];
  const favorite = dishes.find((d) => d.name === owner.favorite);
  return favorite && random() < FAVORITE_DISH_RATE ? favorite : pick(dishes);
}

function buildRecipe(index, seedUsers, now) {
  // Round-robin keeps the four equipment types evenly represented.
  const equipment = EQUIPMENT[index % EQUIPMENT.length];
  const owner = pickOwner(equipment, seedUsers);
  const dish = pickDish(equipment, owner);
  const variation = VARIATIONS[pick(dish.variations)];
  const createdAt = new Date(
    now - random() * HISTORY_DAYS * 24 * 60 * 60 * 1000,
  );

  return {
    title: `${variation.prefix} ${dish.name}`,
    equipment,
    prepTime: intBetween(...dish.prepTime),
    cost: random() < NULL_COST_RATE ? null : priceFor(dish, variation),
    ingredients: variation.ingredient
      ? [...dish.ingredients, variation.ingredient]
      : [...dish.ingredients],
    steps: variation.step ? [...dish.steps, variation.step] : [...dish.steps],
    ownerId: owner._id,
    createdAt,
    updatedAt: createdAt,
  };
}

async function main() {
  await connect();
  const db = getDb();
  const users = db.collection("users");
  const recipes = db.collection("recipes");
  await ensureUserIndexes();

  const oldSeedIds = (
    await users.find({ seeded: true }, { projection: { _id: 1 } }).toArray()
  ).map((u) => u._id);
  const removedRecipes = await recipes.deleteMany({
    ownerId: { $in: oldSeedIds },
  });
  const removedUsers = await users.deleteMany({ seeded: true });
  console.log(
    `Removed ${removedRecipes.deletedCount} old seed recipes and ${removedUsers.deletedCount} old seed users`,
  );

  // A real user who registered one of the seed names would make createUser fail;
  // stop before inserting anything rather than half-seeding.
  const usernames = SEED_USERS.map((u) => u.username);
  const clashes = await users.find({ username: { $in: usernames } }).toArray();
  if (clashes.length > 0) {
    throw new Error(
      `Seed usernames already taken by real users: ${clashes.map((u) => u.username).join(", ")}`,
    );
  }

  const seedUsers = [];
  for (const profile of SEED_USERS) {
    const user = await createUser(profile.username, SEED_PASSWORD, {
      seeded: true,
    });
    seedUsers.push({ ...profile, _id: user._id });
  }

  const now = Date.now();
  const docs = Array.from({ length: RECIPE_COUNT }, (_, i) =>
    buildRecipe(i, seedUsers, now),
  );
  const result = await recipes.insertMany(docs);
  console.log(
    `Created ${seedUsers.length} seed users and ${result.insertedCount} recipes`,
  );
}

try {
  await main();
} catch (err) {
  console.error("Seeding failed:", err);
  process.exitCode = 1;
} finally {
  await close();
}
