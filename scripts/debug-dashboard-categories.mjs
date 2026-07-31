import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI="([^"]+)"/)[1];
const client = new MongoClient(uri);
await client.connect();
const db = client.db("proconfection");

const cats = await db
  .collection("dashboard_categories")
  .find({}, { projection: { _id: 0, id: 1, name: 1, slug: 1, isActive: 1 } })
  .toArray();

console.log("--- DASHBOARD CATEGORIES ---");
for (const c of cats) console.log(JSON.stringify(c));

const prods = await db
  .collection("products")
  .find({}, { projection: { _id: 0, name: 1, category: 1, subcategory: 1 } })
  .toArray();

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const catNames = cats.filter((c) => c.isActive !== false).map((c) => c.name);
console.log("\n--- MATCH CHECK ---");
for (const cat of catNames) {
  const matched = prods.filter((p) => norm(p.category) === norm(cat));
  console.log(`${cat}: ${matched.length} products`);
}

const unmatched = prods.filter(
  (p) => !catNames.some((cat) => norm(p.category) === norm(cat)),
);
console.log("\n--- UNMATCHED PRODUCTS ---");
for (const p of unmatched) {
  console.log(`[${JSON.stringify(p.category)}] ${p.name}`);
}

// subcategory mismatches vs parent
console.log("\n--- SUBCATEGORY SAMPLES ---");
const byCat = {};
for (const p of prods) {
  const key = p.category;
  if (!byCat[key]) byCat[key] = new Set();
  if (p.subcategory) byCat[key].add(p.subcategory);
}
for (const [cat, subs] of Object.entries(byCat)) {
  console.log(cat, "->", [...subs].join(" | "));
}

await client.close();
