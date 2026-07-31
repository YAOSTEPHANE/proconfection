import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI="([^"]+)"/)[1];
const client = new MongoClient(uri);
await client.connect();
const db = client.db("proconfection");

// Produits Jacques Prevert avec sous-catégorie Jean Mermoz → corriger
const result = await db.collection("products").updateMany(
  { category: "Jacques Prevert", subcategory: "College JM" },
  { $set: { category: "Jean Mermoz", subcategory: "College JM" } },
);
console.log("moved JP+College JM → Jean Mermoz:", result.modifiedCount);

const samples = await db
  .collection("products")
  .find(
    { subcategory: "College JM" },
    { projection: { _id: 0, name: 1, category: 1, subcategory: 1 } },
  )
  .toArray();
for (const p of samples) {
  console.log(`[${p.category}] ${p.subcategory} — ${p.name}`);
}

await client.close();
