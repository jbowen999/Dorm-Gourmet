// TODO(Jerith): users collection: create, find by username, find by id.
// See docs/DESIGN.md §6 for fields. Never return passwordHash to the client.
import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

const users = () => getDb().collection("users");

export async function ensureUserIndexes() {
  await users().createIndex({ username: 1 }, { unique: true });
}

export async function findUserById(id) {
  if (!ObjectId.isValid(id)) return null;
  return users().findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
}
