import { NextResponse } from "next/server";
import { getServiceTemplateCatalog } from "../../../../../lib/global-service-catalog";
import { localizeCategoryName, type CategoryTemplate } from "../../../../../lib/service-templates";
import { getMobileProfessionalId } from "../_auth";
import {
  addServicesForProfessional,
  deleteServiceForProfessional,
  ensureServiceForProfessional,
  getWorkspaceSnapshot,
  reorderServicesForProfessional,
  updateServiceForProfessional
} from "../../../../../lib/pro-data";
import { sendSuperadminTelegramNotification } from "../../../../../lib/telegram-bot";

type ServiceInput = {
  name?: string;
  localizedName?: Record<string, string>;
  category?: string;
  durationMinutes?: number;
  price?: number;
  color?: string;
  source?: "catalog" | "custom";
};

function withLocalizedCatalogTitles(catalog: CategoryTemplate[]) {
  return catalog.map((category) => ({
    ...category,
    localizedTitle: {
      ru: localizeCategoryName(category.title, "ru"),
      uk: localizeCategoryName(category.title, "uk"),
      en: localizeCategoryName(category.title, "en"),
      fr: localizeCategoryName(category.title, "fr"),
      pl: localizeCategoryName(category.title, "pl"),
      cs: localizeCategoryName(category.title, "cs"),
      es: localizeCategoryName(category.title, "es"),
      de: localizeCategoryName(category.title, "de")
    }
  }));
}

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

    return NextResponse.json({
      services: workspace.services,
      catalog: withLocalizedCatalogTitles(await getServiceTemplateCatalog())
    });
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

    const workspaceBefore = await getWorkspaceSnapshot(professionalId);
    if (!workspaceBefore) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    const existingServiceIds = new Set(workspaceBefore.services.map((service) => service.id));
    const professionalName =
      `${workspaceBefore.professional.firstName} ${workspaceBefore.professional.lastName}`.trim() ||
      "";
    const body = await request.json();
    const services: ServiceInput[] = Array.isArray(body.services)
      ? body.services
      : [
          {
            name: body.name,
            localizedName: body.localizedName,
            category: body.category,
            durationMinutes: body.durationMinutes,
            price: body.price,
            color: body.color,
            source: body.source
          }
        ];

    if (services.length === 1) {
      const service = await ensureServiceForProfessional({
        professionalId,
        serviceName: String(services[0].name || ""),
        localizedName: services[0].localizedName,
        category: services[0].category,
        durationMinutes: Number(services[0].durationMinutes || 60),
        price: Number(services[0].price || 0),
        color: services[0].color,
        source: services[0].source === "catalog" ? "catalog" : "custom"
      });

      if (!existingServiceIds.has(service.id) && service.source === "custom") {
        await sendSuperadminTelegramNotification({
          eventType: "service_added",
          professionalId,
          professionalName,
          professionalEmail: workspaceBefore.professional.email,
          businessId: workspaceBefore.business.id,
          businessName: workspaceBefore.business.name,
          services: [service]
        }).catch(() => undefined);
      }

      return NextResponse.json({ service });
    }

    const created = await addServicesForProfessional({
      professionalId,
      services: services.map((service) => ({
        name: String(service.name || ""),
        localizedName: service.localizedName,
        category: service.category,
        durationMinutes: Number(service.durationMinutes || 60),
        price: Number(service.price || 0),
        color: service.color,
        source: service.source === "catalog" ? "catalog" : "custom"
      }))
    });

    const customActuallyAdded = created.filter((service) => !existingServiceIds.has(service.id) && service.source === "custom");
    if (customActuallyAdded.length) {
      await sendSuperadminTelegramNotification({
        eventType: "service_added",
        professionalId,
        professionalName,
        professionalEmail: workspaceBefore.professional.email,
        businessId: workspaceBefore.business.id,
        businessName: workspaceBefore.business.name,
        services: customActuallyAdded
      }).catch(() => undefined);
    }

    return NextResponse.json({ services: created });
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
      localizedName: body.localizedName,
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
