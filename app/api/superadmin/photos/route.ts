import { NextResponse } from "next/server";
import {
  deletePhotoAsSuperadmin,
  getSuperadminPhotos,
  setPhotoBlocked
} from "../../../../lib/admin-data";
import { requireSuperadminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireSuperadminSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const photos = await getSuperadminPhotos(search);
    return NextResponse.json({ photos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить фотографии.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperadminSession();
    const body = await request.json();
    const result = await setPhotoBlocked({
      businessId: String(body.businessId || ""),
      photoId: String(body.photoId || ""),
      isBlocked: body.isBlocked === true
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить статус фото.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireSuperadminSession();
    const { searchParams } = new URL(request.url);
    const result = await deletePhotoAsSuperadmin({
      businessId: String(searchParams.get("businessId") || ""),
      photoId: String(searchParams.get("photoId") || "")
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить фото.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
