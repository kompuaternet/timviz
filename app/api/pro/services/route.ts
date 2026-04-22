import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  addServicesForProfessional,
  deleteServiceForProfessional,
  ensureServiceForProfessional,
  getWorkspaceSnapshot,
  reorderServicesForProfessional,
  updateServiceForProfessional
} from "../../../../lib/pro-data";
import { SERVICE_TEMPLATE_CATALOG } from "../../../../lib/service-templates";

type ServiceInput = {
  name?: string;
  category?: string;
  durationMinutes?: number;
  price?: number;
  color?: string;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getWorkspaceSnapshot(professionalId);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    return NextResponse.json({
      workspace,
      catalog: SERVICE_TEMPLATE_CATALOG
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load services.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const services: ServiceInput[] = Array.isArray(body.services)
      ? body.services
      : [
          {
            name: body.name,
            category: body.category,
            durationMinutes: body.durationMinutes,
            price: body.price,
            color: body.color
          }
        ];

    if (services.length === 1) {
      const created = await ensureServiceForProfessional({
        professionalId,
        serviceName: String(services[0].name || ""),
        category: services[0].category,
        durationMinutes: Number(services[0].durationMinutes || 60),
        price: Number(services[0].price || 0),
        color: services[0].color
      });

      return NextResponse.json(created);
    }

    const created = await addServicesForProfessional({
      professionalId,
      services: services.map((service) => ({
        name: String(service.name || ""),
        category: service.category,
        durationMinutes: Number(service.durationMinutes || 60),
        price: Number(service.price || 0),
        color: service.color
      }))
    });

    return NextResponse.json({ services: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save service.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (Array.isArray(body.serviceIds)) {
      const result = await reorderServicesForProfessional({
        professionalId,
        serviceIds: body.serviceIds.map(String)
      });

      return NextResponse.json(result);
    }

    const updated = await updateServiceForProfessional({
      professionalId,
      serviceId: String(body.serviceId || ""),
      name: body.name,
      category: body.category,
      durationMinutes:
        typeof body.durationMinutes === "number"
          ? body.durationMinutes
          : Number(body.durationMinutes || 0),
      price: typeof body.price === "number" ? body.price : Number(body.price || 0),
      color: body.color
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update service.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
