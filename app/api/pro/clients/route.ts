import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  createClientProfile,
  getClientsList,
  mergeClientsByPhone,
  updateClientProfile
} from "../../../../lib/pro-clients";

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

export async function GET() {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const clients = await getClientsList(professionalId);
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();

  if (body.mode === "merge") {
    const result = await mergeClientsByPhone(professionalId);
    return NextResponse.json(result);
  }

  try {
    const client = await createClientProfile({
      professionalId,
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      telegram: body.telegram ?? "",
      notes: body.notes ?? "",
      notificationsTelegram: Boolean(body.notificationsTelegram),
      marketingTelegram: Boolean(body.marketingTelegram)
    });

    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать клиента." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const client = await updateClientProfile({
      professionalId,
      clientId: body.clientId ?? "",
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      telegram: body.telegram ?? "",
      notes: body.notes ?? "",
      notificationsTelegram: Boolean(body.notificationsTelegram),
      marketingTelegram: Boolean(body.marketingTelegram)
    });

    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сохранить клиента." },
      { status: 400 }
    );
  }
}
