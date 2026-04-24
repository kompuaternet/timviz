import { NextResponse } from "next/server";
import {
  deleteServiceAsSuperadmin,
  getSuperadminServices,
  setServiceBlocked
} from "../../../../lib/admin-data";
import { requireSuperadminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireSuperadminSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const services = await getSuperadminServices(search);
    return NextResponse.json({ services });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить услуги.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperadminSession();
    const body = await request.json();
    const result = await setServiceBlocked(String(body.serviceId || ""), body.isBlocked === true);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить статус услуги.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireSuperadminSession();
    const { searchParams } = new URL(request.url);
    const result = await deleteServiceAsSuperadmin(String(searchParams.get("serviceId") || ""));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить услугу.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
