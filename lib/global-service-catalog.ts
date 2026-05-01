import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import {
  CategoryTemplate,
  SERVICE_TEMPLATE_CATALOG,
  getServiceLocalizedText,
  type ServiceTemplate
} from "./service-templates";

export type GlobalCatalogGroupKey = "topSuggestions" | "popularServices";

export type GlobalCatalogItem = {
  id: string;
  category: string;
  groupKey: GlobalCatalogGroupKey;
  name: string;
  durationMinutes?: number;
  price?: number;
  sortOrder: number;
};

const storePath = path.join(process.cwd(), "data", "global-service-catalog.json");

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function staticMetaForCategory(category: string) {
  return (
    SERVICE_TEMPLATE_CATALOG.find((item) => item.title === category) ??
    SERVICE_TEMPLATE_CATALOG.find((item) => item.key === category) ??
    SERVICE_TEMPLATE_CATALOG.find((item) => item.key === "Другая")!
  );
}

function normalizeItems(input: unknown): GlobalCatalogItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const rows = input
    .map((item, index): GlobalCatalogItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<GlobalCatalogItem>;
      const category = typeof candidate.category === "string" ? candidate.category.trim() : "";
      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";

      if (!category || !name) {
        return null;
      }

      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : makeId("root_svc"),
        category,
        groupKey: candidate.groupKey === "popularServices" ? "popularServices" : "topSuggestions",
        name,
        durationMinutes:
          typeof candidate.durationMinutes === "number" && Number.isFinite(candidate.durationMinutes)
            ? Math.max(5, Math.round(candidate.durationMinutes))
            : undefined,
        price:
          typeof candidate.price === "number" && Number.isFinite(candidate.price)
            ? Math.max(0, Math.round(candidate.price))
            : undefined,
        sortOrder:
          typeof candidate.sortOrder === "number" && Number.isFinite(candidate.sortOrder)
            ? candidate.sortOrder
            : index
      } satisfies GlobalCatalogItem;
    });

  return rows
    .filter((item): item is GlobalCatalogItem => item !== null)
    .sort((left, right) => left.category.localeCompare(right.category) || left.sortOrder - right.sortOrder);
}

function flattenStaticCatalog(): GlobalCatalogItem[] {
  return SERVICE_TEMPLATE_CATALOG.flatMap((category) => [
    ...category.topSuggestions.map((service, index) => ({
      id: `${category.title}-top-${index}`,
      category: category.title,
      groupKey: "topSuggestions" as const,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      sortOrder: index
    })),
    ...category.popularServices.map((service, index) => ({
      id: `${category.title}-popular-${index}`,
      category: category.title,
      groupKey: "popularServices" as const,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      sortOrder: index
    }))
  ]);
}

function buildTemplateServices(items: GlobalCatalogItem[]): ServiceTemplate[] {
  return items
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .map((item) => ({
      name: item.name,
      localizedName: getServiceLocalizedText(item.name),
      durationMinutes: item.durationMinutes,
      price: item.price
    }));
}

function buildCatalogFromItems(items: GlobalCatalogItem[]): CategoryTemplate[] {
  if (items.length === 0) {
    return SERVICE_TEMPLATE_CATALOG;
  }

  const categories = Array.from(new Set(items.map((item) => item.category)));

  return categories.map((categoryTitle) => {
    const meta = staticMetaForCategory(categoryTitle);
    const categoryItems = items.filter((item) => item.category === categoryTitle);

    return {
      key: meta.key,
      title: categoryTitle,
      heroTitle: meta.heroTitle,
      heroDescription: meta.heroDescription,
      topSuggestions: buildTemplateServices(
        categoryItems.filter((item) => item.groupKey === "topSuggestions")
      ),
      popularServices: buildTemplateServices(
        categoryItems.filter((item) => item.groupKey === "popularServices")
      )
    };
  });
}

async function readLocalCatalogItems() {
  try {
    const contents = await fs.readFile(storePath, "utf8");
    return normalizeItems(JSON.parse(contents));
  } catch {
    return [];
  }
}

async function writeLocalCatalogItems(items: GlobalCatalogItem[]) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function isMissingTableError(message = "") {
  return /relation .*global_service_catalog/i.test(message) || /global_service_catalog/i.test(message);
}

export async function getRootCatalogItems(): Promise<GlobalCatalogItem[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("global_service_catalog")
        .select("*")
        .order("category", { ascending: true })
        .order("group_key", { ascending: true })
        .order("sort_order", { ascending: true });

      if (!error) {
        return normalizeItems(
          (data ?? []).map((item) => ({
            id: item.id,
            category: item.category,
            groupKey: item.group_key,
            name: item.name,
            durationMinutes: item.duration_minutes,
            price: item.price,
            sortOrder: item.sort_order
          }))
        );
      }

      if (!isMissingTableError(error.message)) {
        throw new Error(error.message);
      }
    }
  }

  const localItems = await readLocalCatalogItems();
  return localItems.length > 0 ? localItems : flattenStaticCatalog();
}

export async function getServiceTemplateCatalog(): Promise<CategoryTemplate[]> {
  const items = await getRootCatalogItems();
  return buildCatalogFromItems(items);
}

export async function upsertRootCatalogItem(input: {
  id?: string;
  category: string;
  groupKey: GlobalCatalogGroupKey;
  name: string;
  durationMinutes?: number;
  price?: number;
  sortOrder?: number;
}) {
  const item: GlobalCatalogItem = {
    id: input.id?.trim() || makeId("root_svc"),
    category: input.category.trim(),
    groupKey: input.groupKey,
    name: input.name.trim(),
    durationMinutes:
      typeof input.durationMinutes === "number" && Number.isFinite(input.durationMinutes)
        ? Math.max(5, Math.round(input.durationMinutes))
        : undefined,
    price:
      typeof input.price === "number" && Number.isFinite(input.price)
        ? Math.max(0, Math.round(input.price))
        : undefined,
    sortOrder:
      typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder) ? input.sortOrder : 0
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from("global_service_catalog").upsert({
        id: item.id,
        category: item.category,
        group_key: item.groupKey,
        name: item.name,
        duration_minutes: item.durationMinutes ?? 60,
        price: item.price ?? 0,
        sort_order: item.sortOrder
      });

      if (!error) {
        return item;
      }

      if (!isMissingTableError(error.message)) {
        throw new Error(error.message);
      }
    }
  }

  const items = await getRootCatalogItems();
  const nextItems = items.some((existing) => existing.id === item.id)
    ? items.map((existing) => (existing.id === item.id ? item : existing))
    : [...items, item];
  await writeLocalCatalogItems(nextItems);
  return item;
}

export async function deleteRootCatalogItem(itemId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from("global_service_catalog").delete().eq("id", itemId);

      if (!error) {
        return { ok: true };
      }

      if (!isMissingTableError(error.message)) {
        throw new Error(error.message);
      }
    }
  }

  const items = await getRootCatalogItems();
  await writeLocalCatalogItems(items.filter((item) => item.id !== itemId));
  return { ok: true };
}
