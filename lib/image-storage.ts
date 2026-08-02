import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { Binary } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type MediaDocument = {
  id: string;
  contentType: string;
  data: Binary;
  createdAt: string;
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export function isDataUrlImage(value: string): boolean {
  return value.trim().startsWith("data:image/");
}

export function isManagedMediaUrl(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("/api/media/") || trimmed.startsWith("/uploads/");
}

export function needsImageMaterialization(value: string): boolean {
  const trimmed = value.trim();
  return isDataUrlImage(trimmed) || trimmed.startsWith("/uploads/");
}

function extensionFromMime(mime: string): string {
  return MIME_TO_EXT[mime.toLowerCase()] ?? "bin";
}

/** Stocke l'image dans MongoDB (compatible Vercel / FS en lecture seule). */
export async function saveBufferAsUpload(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (buffer.length === 0) {
    throw new Error("Image vide.");
  }

  const db = await getDb();
  const id = randomUUID();
  const contentType = mimeType || "application/octet-stream";
  const doc: MediaDocument = {
    id,
    contentType,
    data: new Binary(buffer),
    createdAt: new Date().toISOString(),
  };

  await db.collection<MediaDocument>("media").insertOne(doc);
  return `/api/media/${id}`;
}

export async function saveDataUrlAsUpload(dataUrl: string): Promise<string> {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i.exec(dataUrl.trim());
  if (!match?.[1] || !match[2]) {
    throw new Error("Image data URL invalide.");
  }
  const buffer = Buffer.from(match[2], "base64");
  return saveBufferAsUpload(buffer, match[1]);
}

async function migrateLegacyUploadPath(uploadPath: string): Promise<string | null> {
  const filename = path.basename(uploadPath);
  if (!filename || filename.includes("..")) {
    return null;
  }

  try {
    const absolute = path.join(process.cwd(), "public", "uploads", filename);
    const buffer = await readFile(absolute);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const mime = EXT_TO_MIME[ext] ?? "image/jpeg";
    return await saveBufferAsUpload(buffer, mime);
  } catch {
    // Fichier absent (prod serverless) : on laisse l'URL telle quelle.
    return null;
  }
}

/**
 * Convertit data URL ou ancien /uploads/… en /api/media/…
 * Laisse inchangé les URLs http(s) et /api/media déjà OK.
 */
export async function materializeImageRef(value: string): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (isDataUrlImage(trimmed)) {
    return saveDataUrlAsUpload(trimmed);
  }

  if (trimmed.startsWith("/uploads/")) {
    const migrated = await migrateLegacyUploadPath(trimmed);
    return migrated ?? trimmed;
  }

  return trimmed;
}

export async function materializeImageRefs(values: string[]): Promise<string[]> {
  const result: string[] = [];
  for (const value of values) {
    result.push(await materializeImageRef(value));
  }
  return result;
}

export async function getMediaById(id: string): Promise<MediaDocument | null> {
  const db = await getDb();
  return db.collection<MediaDocument>("media").findOne({ id }, { projection: { _id: 0 } });
}

export function mediaPublicUrl(id: string): string {
  return `/api/media/${id}`;
}

export function guessFilename(contentType: string, id: string): string {
  return `${id}.${extensionFromMime(contentType)}`;
}
