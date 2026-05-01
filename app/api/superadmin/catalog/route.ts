import { NextResponse } from "next/server";
import {
  getSuperadminCatalogItems,
  removeSuperadminCatalogItem,
  saveSuperadminCatalogItem
} from "../../../../lib/admin-data";
import { requireSuperadminSession } from "../../../../lib/admin-auth";

export async function GET() {
  try {
    await requireSuperadminSession();
    const items = await getSuperadminCatalogItems();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить корневой каталог.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperadminSession();
    const body = await request.json();
    const nestedLocalized =
      body.localizedName && typeof body.localizedName === "object" ? body.localizedName : {};
    const localizedNameRu = String(body.localizedNameRu ?? nestedLocalized.ru ?? "").trim();
    const localizedNameUk = String(body.localizedNameUk ?? nestedLocalized.uk ?? "").trim();
    const localizedNameEn = String(body.localizedNameEn ?? nestedLocalized.en ?? "").trim();
    const localizedName =
      localizedNameRu || localizedNameUk || localizedNameEn
        ? {
            ...(localizedNameRu ? { ru: localizedNameRu } : {}),
            ...(localizedNameUk ? { uk: localizedNameUk } : {}),
            ...(localizedNameEn ? { en: localizedNameEn } : {})
          }
        : undefined;
    const item = await saveSuperadminCatalogItem({
      id: typeof body.id === "string" ? body.id : undefined,
      category: String(body.category || ""),
      groupKey: body.groupKey === "popularServices" ? "popularServices" : "topSuggestions",
      name: String(body.name || ""),
      localizedName,
      durationMinutes:
        typeof body.durationMinutes === "number"
          ? body.durationMinutes
          : Number(body.durationMinutes),
      price: typeof body.price === "number" ? body.price : Number(body.price),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Number(body.sortOrder)
    });
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить элемент каталога.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireSuperadminSession();
    const { searchParams } = new URL(request.url);
    const result = await removeSuperadminCatalogItem(String(searchParams.get("itemId") || ""));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить элемент каталога.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
