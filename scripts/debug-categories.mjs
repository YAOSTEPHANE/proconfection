import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI="([^"]+)"/)[1];
const client = new MongoClient(uri);
await client.connect();
const db = client.db("proconfection");

const cats = await db
  .collection("categories")
  .find({}, { projection: { _id: 0, name: 1, slug: 1, isActive: 1 } })
  .toArray();
const prods = await db
  .collection("products")
  .find({}, { projection: { _id: 0, id: 1, name: 1, category: 1, subcategory: 1 } })
  .sort({ name: 1 })
  .toArray();

console.log("--- CATEGORIES ---");
for (const c of cats) {
  console.log(JSON.stringify(c));
}
console.log("--- PRODUCTS ---");
for (const p of prods) {
  console.log(`[${p.category}] (${p.subcategory || "-"}) ${p.name}`);
}

const catNames = new Set(cats.map((c) => c.name.trim().toLowerCase()));
const orphan = prods.filter((p) => !catNames.has(String(p.category || "").trim().toLowerCase()));
console.log("--- ORPHANS (category not in categories collection) ---");
for (const p of orphan) {
  console.log(`[${p.category}] ${p.name}`);
}

await client.close();
