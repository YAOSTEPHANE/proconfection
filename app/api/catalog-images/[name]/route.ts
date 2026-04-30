import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ASSETS_DIR = "C:/Users/UTILISATEUR/.cursor/projects/f-proconfection/assets";
const ALLOWED_PREFIX =
  "c__Users_UTILISATEUR_AppData_Roaming_Cursor_User_workspaceStorage_13745dcdcf3310a01267e07c41a81bf6_images_";

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const decodedName = decodeURIComponent(name);

  if (
    !decodedName.endsWith(".png") ||
    !decodedName.startsWith(ALLOWED_PREFIX) ||
    decodedName.includes("/") ||
    decodedName.includes("\\")
  ) {
    return NextResponse.json({ error: "Image invalide." }, { status: 400 });
  }

  const absolutePath = path.join(ASSETS_DIR, decodedName);

  try {
    const file = await readFile(absolutePath);
    return new NextResponse(file, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
  }
}
