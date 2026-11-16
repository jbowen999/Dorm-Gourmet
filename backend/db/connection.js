import { MongoClient } from "mongodb";

let client;
let db;

export async function connect() {
  if (db) return db;

  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;
  if (!uri || !dbName) {
    throw new Error("MONGO_URI and DB_NAME must be set in the environment");
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log(`Connected to MongoDB database "${dbName}"`);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return db;
}
