import { MongoClient } from "mongodb";

let client;
let db;

export async function connectDb() {
  if (db) return db;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set. Copy backend/.env.example to backend/.env.");
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.DB_NAME || "dormGourmet");
  console.log(`Connected to MongoDB database "${db.databaseName}"`);
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not connected. Call connectDb() first.");
  return db;
}

export async function closeDb() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}
