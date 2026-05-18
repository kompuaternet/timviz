import { NextResponse } from "next/server";
import { parseDataImageUrl, uploadPublicImage, type MediaUploadKind } from "../../../../../../lib/media-storage";
import { getMobileProfessionalId } from "../../_auth";

const validKinds = new Set<MediaUploadKind>(["avatar", "business-photo"]);

export async function POST(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const kind = String(body?.kind || "");
    if (!validKinds.has(kind as MediaUploadKind)) {
      return NextResponse.json({ error: "Invalid media kind." }, { status: 400 });
    }

    const parsed = parseDataImageUrl(String(body?.dataUrl || ""));
    const url = await uploadPublicImage({
      ownerId: professionalId,
      kind: kind as MediaUploadKind,
      contentType: parsed.contentType,
      buffer: parsed.buffer
    });

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image." },
      { status: 400 }
    );
  }
}
