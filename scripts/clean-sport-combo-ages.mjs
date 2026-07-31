import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI="([^"]+)"/)[1];
const client = new MongoClient(uri);
await client.connect();
const db = client.db("proconfection");

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

function buildCombo(ages, tshirtPrice, shortPrice) {
  const comboByAge = {};
  for (const age of ages) {
    comboByAge[age] = {
      tshirtSize: age,
      shortSize: defaultShortSizeForAge(age),
      tshirtPrice,
      shortPrice,
    };
  }
  const sizePrices = Object.fromEntries(
    ages.map((age) => [age, Math.round(tshirtPrice + shortPrice)]),
  );
  return { comboByAge, sizePrices };
}

const cleanups = [
  {
    id: "bp-sport-fille-blanc-bleu",
    ages: ["4 ans", "5 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans"],
  },
  {
    id: "bp-sport-garcon-blanc-bleu-2",
    ages: ["8 ans", "10 ans", "12 ans", "14 ans"],
  },
  {
    id: "bp-sport-garcon-blanc-bleu",
    ages: ["6 ans", "8 ans", "10 ans", "12 ans"],
  },
];

for (const item of cleanups) {
  const product = await db.collection("products").findOne({ id: item.id });
  if (!product) {
    console.log("missing", item.id);
    continue;
  }
  const tshirtPrice = product.tshirtPrice > 0 ? product.tshirtPrice : 6500;
  const shortPrice = product.shortPrice > 0 ? product.shortPrice : 6000;
  const { comboByAge, sizePrices } = buildCombo(item.ages, tshirtPrice, shortPrice);
  await db.collection("products").updateOne(
    { id: item.id },
    {
      $set: {
        sizes: item.ages,
        comboByAge,
        sizePrices,
        tshirtPrice,
        shortPrice,
        price: Math.round(tshirtPrice + shortPrice),
      },
    },
  );
  console.log(
    "cleaned",
    item.id,
    item.ages.join(","),
    "→ shorts",
    item.ages.map((a) => comboByAge[a].shortSize).join("/"),
  );
}

await client.close();
