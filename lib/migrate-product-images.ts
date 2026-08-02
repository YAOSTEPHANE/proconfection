import type { Product } from "@/lib/catalog";
import {
  materializeImageRef,
  materializeImageRefs,
  needsImageMaterialization,
} from "@/lib/image-storage";
import type { Db } from "mongodb";

export async function materializeProductImages(
  db: Db,
  product: Product,
): Promise<Product> {
  const needsMain = needsImageMaterialization(product.image);
  const gallery = product.images ?? [];
  const needsGallery = gallery.some((image) => needsImageMaterialization(image));

  if (!needsMain && !needsGallery) {
    return product;
  }

  const image = needsMain ? await materializeImageRef(product.image) : product.image;
  const images = needsGallery ? await materializeImageRefs(gallery) : gallery;

  // Si /uploads/ n'a pas pu être migré (fichier absent en serverless), ne pas boucler.
  if (image === product.image && (!needsGallery || images.every((value, i) => value === gallery[i]))) {
    return product;
  }

  const next: Product = {
    ...product,
    image,
    images: images.length > 0 ? images : undefined,
  };

  await db.collection<Product>("products").updateOne(
    { id: product.id },
    next.images
      ? { $set: { image: next.image, images: next.images } }
      : { $set: { image: next.image }, $unset: { images: "" } },
  );

  return next;
}

export async function materializeProductsImages(
  db: Db,
  products: Product[],
): Promise<Product[]> {
  const result: Product[] = [];
  for (const product of products) {
    result.push(await materializeProductImages(db, product));
  }
  return result;
}
