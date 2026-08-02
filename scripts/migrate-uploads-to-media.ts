/**
 * Migre public/uploads + data URLs Mongo → collection media (/api/media/…).
 * npx tsx scripts/migrate-uploads-to-media.ts
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

async function main() {
  const { getDb } = await import("../lib/mongodb");
  const { materializeImageRef, needsImageMaterialization } = await import("../lib/image-storage");
  const { materializeProductsImages } = await import("../lib/migrate-product-images");
  type Product = import("../lib/catalog").Product;
  type DashboardBanner = import("../lib/dashboard-content").DashboardBanner;

  const db = await getDb();

  const products = await db
    .collection<Product>("products")
    .find({}, { projection: { _id: 0 } })
    .toArray();
  const beforeUploads = products.filter((p) => needsImageMaterialization(p.image)).length;
  const migratedProducts = await materializeProductsImages(db, products);
  const afterUploads = migratedProducts.filter((p) => p.image.startsWith("/uploads/")).length;
  const mediaCount = migratedProducts.filter((p) => p.image.startsWith("/api/media/")).length;

  const banners = await db
    .collection<DashboardBanner>("dashboard_banners")
    .find({}, { projection: { _id: 0 } })
    .toArray();
  let bannersMigrated = 0;
  for (const banner of banners) {
    if (!needsImageMaterialization(banner.image)) continue;
    const image = await materializeImageRef(banner.image);
    if (image !== banner.image) {
      await db.collection("dashboard_banners").updateOne({ id: banner.id }, { $set: { image } });
      bannersMigrated += 1;
    }
  }

  let diskFiles = 0;
  try {
    diskFiles = readdirSync(path.join(process.cwd(), "public", "uploads")).filter(
      (name) => name !== ".gitkeep",
    ).length;
  } catch {
    diskFiles = 0;
  }

  console.log(
    JSON.stringify(
      {
        productsTotal: products.length,
        productsNeedingMigration: beforeUploads,
        productsStillOnUploads: afterUploads,
        productsOnMedia: mediaCount,
        bannersMigrated,
        diskUploadFiles: diskFiles,
      },
      null,
      2,
    ),
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
