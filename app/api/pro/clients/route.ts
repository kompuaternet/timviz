import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createApiTimer } from "../../../../lib/api-timing";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  createClientProfile,
  deleteClientProfile,
  getClientsList,
  mergeClientsByPhone,
  updateClientProfile
} from "../../../../lib/pro-clients";

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

export async function GET() {
  const timer = createApiTimer("api/pro/clients GET");
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    timer({ status: 401 });
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const clients = await getClientsList(professionalId);
  timer({ status: 200, clients: clients.length });
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

export async function DELETE(request: Request) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  try {
    const result = await deleteClientProfile({
      professionalId,
      clientId: searchParams.get("clientId") ?? ""
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось удалить клиента." },
      { status: 400 }
    );
  }
}
