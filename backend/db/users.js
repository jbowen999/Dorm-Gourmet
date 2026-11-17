import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

const BCRYPT_COST = 10;

function users() {
  return getDb().collection("users");
}

// Idempotent: createIndex is a no-op if an identical index already exists.
export async function ensureUserIndexes() {
  await users().createIndex({ username: 1 }, { unique: true });
}

// extraFields (e.g. { seeded: true }) can't override username or passwordHash.
export async function createUser(username, password, extraFields = {}) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = {
    ...extraFields,
    username,
    passwordHash,
    createdAt: new Date(),
  };
  const result = await users().insertOne(user);
  return { _id: result.insertedId, ...user };
}

export async function findUserByUsername(username) {
  return users().findOne({ username });
}

export async function findUserById(id) {
  if (!ObjectId.isValid(id)) return null;
  return users().findOne({ _id: new ObjectId(id) });
}

// Shape returned to clients: never includes passwordHash.
export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
  };
}
