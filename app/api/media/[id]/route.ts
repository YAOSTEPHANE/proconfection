import { NextResponse } from "next/server";
import { getMediaById, guessFilename } from "@/lib/image-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Identifiant media invalide." }, { status: 400 });
    }

    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json({ error: "Media introuvable." }, { status: 404 });
    }

    const bytes = Buffer.from(
      media.data.buffer.buffer,
      media.data.buffer.byteOffset,
      media.data.buffer.byteLength,
    );
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": media.contentType || "application/octet-stream",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename="${guessFilename(media.contentType, id)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lecture media impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
