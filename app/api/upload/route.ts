import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";
import { saveBufferAsUpload } from "@/lib/image-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 8;

export async function POST(request: Request) {
  try {
    const isAuthorized = await hasValidAdminSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: "Acces non autorise." }, { status: 401 });
    }

    const formData = await request.formData();
    const entries = formData.getAll("files");
    const files = entries.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier image." }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} fichiers par envoi.` },
        { status: 400 },
      );
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `Fichier non image: ${file.name || "sans nom"}` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `Image trop lourde (max 4 Mo): ${file.name || "sans nom"}` },
          { status: 400 },
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      urls.push(await saveBufferAsUpload(buffer, file.type || "image/jpeg"));
    }

    return NextResponse.json({ urls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
