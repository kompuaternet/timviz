import { NextResponse } from "next/server";
import { getMobileProfessionalId } from "../_auth";
import {
  deleteServiceForProfessional,
  ensureServiceForProfessional,
  getWorkspaceSnapshot,
  reorderServicesForProfessional,
  updateServiceForProfessional
} from "../../../../../lib/pro-data";

export async function GET(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const workspace = await getWorkspaceSnapshot(professionalId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    return NextResponse.json({ services: workspace.services });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load services.";
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
    const service = await ensureServiceForProfessional({
      professionalId,
      serviceName: String(body.name || ""),
      category: body.category,
      durationMinutes: Number(body.durationMinutes || 60),
      price: Number(body.price || 0),
      color: body.color,
      source: body.source === "catalog" ? "catalog" : "custom"
    });

    return NextResponse.json({ service });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create service.";
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
    if (Array.isArray(body.serviceIds)) {
      const result = await reorderServicesForProfessional({
        professionalId,
        serviceIds: body.serviceIds.map(String)
      });
      return NextResponse.json(result);
    }

    const service = await updateServiceForProfessional({
      professionalId,
      serviceId: String(body.serviceId || ""),
      name: body.name,
      category: body.category,
      durationMinutes: Number(body.durationMinutes || 0),
      price: Number(body.price || 0),
      color: body.color
    });

    return NextResponse.json({ service });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update service.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId") || "";
    const result = await deleteServiceForProfessional({ professionalId, serviceId });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete service.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
