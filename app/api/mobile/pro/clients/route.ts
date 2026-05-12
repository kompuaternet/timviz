import { NextResponse } from "next/server";
import { getMobileProfessionalId } from "../_auth";
import {
  createClientProfile,
  getClientsList,
  mergeClientsByPhone,
  updateClientProfile
} from "../../../../../lib/pro-clients";

export async function GET(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const clients = await getClientsList(professionalId);
    return NextResponse.json({ clients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load clients.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    if (body.mode === "merge") {
      const result = await mergeClientsByPhone(professionalId);
      return NextResponse.json(result);
    }

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
    const message = error instanceof Error ? error.message : "Failed to create client.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
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
    const message = error instanceof Error ? error.message : "Failed to update client.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
