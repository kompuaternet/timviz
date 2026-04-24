import { NextResponse } from "next/server";
import {
  deleteProfessionalAsSuperadmin,
  getSuperadminUsers,
  setProfessionalBalances
} from "../../../../lib/admin-data";
import { requireSuperadminSession } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requireSuperadminSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const users = await getSuperadminUsers(search);
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить пользователей.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperadminSession();
    const body = await request.json();
    const result = await setProfessionalBalances({
      professionalId: String(body.professionalId || ""),
      bookingCreditsTotal:
        typeof body.bookingCreditsTotal === "number"
          ? body.bookingCreditsTotal
          : Number(body.bookingCreditsTotal),
      walletBalance:
        typeof body.walletBalance === "number" ? body.walletBalance : Number(body.walletBalance)
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить баланс.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireSuperadminSession();
    const { searchParams } = new URL(request.url);
    const result = await deleteProfessionalAsSuperadmin(String(searchParams.get("professionalId") || ""));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить пользователя.";
    const status = message === "SUPERADMIN_UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
