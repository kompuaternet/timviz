import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { parseDataImageUrl, uploadPublicImage, type MediaUploadKind } from "../../../../../lib/media-storage";

const validKinds = new Set<MediaUploadKind>(["avatar", "business-photo"]);

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

async function readUpload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const kind = String(formData.get("kind") || "");
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("Image file is required.");
    }
    return {
      kind,
      contentType: file.type,
      buffer: Buffer.from(await file.arrayBuffer())
    };
  }

  const body = await request.json();
  const parsed = parseDataImageUrl(String(body?.dataUrl || ""));
  return {
    kind: String(body?.kind || ""),
    contentType: parsed.contentType,
    buffer: parsed.buffer
  };
}

export async function POST(request: Request) {
  const professionalId = await getProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const upload = await readUpload(request);
    if (!validKinds.has(upload.kind as MediaUploadKind)) {
      return NextResponse.json({ error: "Invalid media kind." }, { status: 400 });
    }

    const url = await uploadPublicImage({
      ownerId: professionalId,
      kind: upload.kind as MediaUploadKind,
      contentType: upload.contentType,
      buffer: upload.buffer
    });

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image." },
      { status: 400 }
    );
  }
}
