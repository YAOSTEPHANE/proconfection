import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const uriMatch = env.match(/MONGODB_URI="([^"]+)"/);
if (!uriMatch) {
  throw new Error("MONGODB_URI manquant dans .env");
}
const uri = uriMatch[1];
const dbName = "proconfection";

function isTshirtShortCombo(name, description) {
  const text = `${name} ${description ?? ""}`.toLowerCase();
  const hasTshirt = /t[-\s]?shirt|tee[-\s]?shirt/.test(text);
  const hasShort = /\bshorts?\b/.test(text);
  if (hasTshirt && hasShort) return true;
  return /\btenue\s+sport\b/.test(text) || (text.includes("sport") && text.includes("tenue"));
}

function parseAgeNumber(age) {
  const match = String(age).match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
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

function buildDefaultComboByAge(ages, tshirtPrice, shortPrice, previous = {}) {
  const next = {};
  for (const age of ages) {
    const existing = previous[age] || {};
    next[age] = {
      tshirtSize: (existing.tshirtSize && String(existing.tshirtSize).trim()) || age,
      shortSize:
        (existing.shortSize && String(existing.shortSize).trim()) || defaultShortSizeForAge(age),
      tshirtPrice:
        typeof existing.tshirtPrice === "number" && existing.tshirtPrice > 0
          ? existing.tshirtPrice
          : tshirtPrice,
      shortPrice:
        typeof existing.shortPrice === "number" && existing.shortPrice > 0
          ? existing.shortPrice
          : shortPrice,
    };
  }
  return next;
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const products = await db.collection("products").find({}).toArray();
let updated = 0;

for (const p of products) {
  if (!isTshirtShortCombo(p.name, p.description)) continue;
  const ages = Array.isArray(p.sizes) ? p.sizes : [];
  const tshirtPrice = p.tshirtPrice > 0 ? p.tshirtPrice : 6500;
  const shortPrice = p.shortPrice > 0 ? p.shortPrice : 6000;
  const comboByAge = buildDefaultComboByAge(ages, tshirtPrice, shortPrice, p.comboByAge || {});
  const sizePrices = Object.fromEntries(
    Object.entries(comboByAge).map(([age, c]) => [age, Math.round(c.tshirtPrice + c.shortPrice)]),
  );
  const price = Math.round(tshirtPrice + shortPrice);
  const $set = { tshirtPrice, shortPrice, price };
  if (ages.length > 0) {
    $set.comboByAge = comboByAge;
    $set.sizePrices = sizePrices;
  }
  await db.collection("products").updateOne({ _id: p._id }, { $set });
  updated += 1;
  console.log(
    "updated",
    p.id || p.name,
    ages.join(","),
    "shorts",
    ages.map((a) => comboByAge[a]?.shortSize).join("/"),
  );
}

console.log("done", updated);
await client.close();
