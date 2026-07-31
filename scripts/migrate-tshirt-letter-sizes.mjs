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
  if (n <= 6) return "S";
  if (n <= 9) return "M";
  if (n <= 12) return "L";
  if (n <= 14) return "XL";
  return "XXL";
}

function defaultShortSizeForAge(age) {
  const n = parseAgeNumber(age);
  if (n === null) return "1";
  if (n <= 5) return "1";
  if (n <= 7) return "2";
  if (n <= 9) return "3";
  if (n <= 11) return "4";
  if (n <= 13) return "5";
  return "6";
}

const LETTER = new Set(["S", "M", "L", "XL", "XXL"]);

const client = new MongoClient(uri);
await client.connect();
const db = client.db("proconfection");
const products = await db.collection("products").find({ comboByAge: { $exists: true } }).toArray();

for (const p of products) {
  const comboByAge = {};
  for (const [age, row] of Object.entries(p.comboByAge || {})) {
    const raw = String(row.tshirtSize || "").trim().toUpperCase();
    comboByAge[age] = {
      ...row,
      tshirtSize: LETTER.has(raw) ? raw : defaultTshirtSizeForAge(age),
      shortSize: row.shortSize || defaultShortSizeForAge(age),
    };
  }
  await db.collection("products").updateOne({ _id: p._id }, { $set: { comboByAge } });
  console.log(
    p.id,
    Object.entries(comboByAge)
      .map(([age, c]) => `${age}→T${c.tshirtSize}/S${c.shortSize}`)
      .join(" | "),
  );
}

console.log("done", products.length);
await client.close();
