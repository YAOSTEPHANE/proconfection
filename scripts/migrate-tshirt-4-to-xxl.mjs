import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI="([^"]+)"/)[1];

function parseAgeNumber(age) {
  const match = String(age).match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function defaultTshirtSizeForAge(age) {
  const n = parseAgeNumber(age);
  if (n === null) return "M";
  if (n <= 4) return "4 ans";
  if (n <= 6) return "6 ans";
  if (n <= 8) return "8 ans";
  if (n <= 10) return "10 ans";
  if (n <= 12) return "12 ans";
  if (n <= 14) return "14 ans";
  if (n <= 16) return "16 ans";
  return "XXL";
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db("proconfection");
const products = await db.collection("products").find({ comboByAge: { $exists: true } }).toArray();

for (const p of products) {
  const comboByAge = {};
  for (const [age, row] of Object.entries(p.comboByAge || {})) {
    comboByAge[age] = {
      ...row,
      tshirtSize: defaultTshirtSizeForAge(age),
    };
  }
  await db.collection("products").updateOne({ _id: p._id }, { $set: { comboByAge } });
  console.log(
    p.id,
    Object.entries(comboByAge)
      .map(([age, c]) => `${age}→${c.tshirtSize}`)
      .join(" | "),
  );
}

console.log("done", products.length);
await client.close();
