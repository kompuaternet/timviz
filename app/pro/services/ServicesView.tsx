"use client";

import { useMemo, useState } from "react";
import ProSidebar from "../ProSidebar";
import ProWorkspaceHeader from "../ProWorkspaceHeader";
import { isProPremiumActive } from "../premium-status";
import styles from "../pro.module.css";
import {
  compareServiceCategories,
  getServiceLocalizationKey,
  localizeCategoryName,
  localizeServiceName,
  sortCategoryTemplates,
  type CategoryTemplate
} from "../../../lib/service-templates";
import { localeBySiteLanguage } from "../../../lib/site-language";
import type { OnboardingCtaState } from "../../../lib/pro-onboarding";
import type { ServiceRecord, WorkspaceSnapshot } from "../../../lib/pro-data";
import { useProLanguage } from "../useProLanguage";
import type { ProLanguage } from "../i18n";

type ServicesViewProps = {
  initialWorkspace: WorkspaceSnapshot;
  catalog: CategoryTemplate[];
  onboardingCta: OnboardingCtaState;
};

type DraftService = {
  name: string;
  localizedName?: ServiceRecord["localizedName"];
  category: string;
  durationMinutes: number;
  price: number;
  color: string;
};

const colorPalette = ["#8bd7e8", "#ffd166", "#7ed6bd", "#b794f4", "#f6729a", "#a5d76e", "#ff9f80", "#90cdf4"];
const ALL_CATEGORIES_KEY = "__all_categories__";
const CANONICAL_SERVICE_LANGUAGE: ProLanguage = "ru";

function isCanonicalServiceLanguage(language: ProLanguage) {
  return Object.is(language, CANONICAL_SERVICE_LANGUAGE);
}

const serviceExtrasBase = {
  ru: {
    addFromCatalogFailed: "Не удалось добавить услугу из каталога.",
    removeFromCatalogFailed: "Не удалось убрать услугу из вашего списка.",
    addedNamed: (name: string) => `"${name}" добавлена в ваш рабочий список.`,
    removedNamed: (name: string) => `"${name}" убрана из вашего рабочего списка.`,
    colorLabel: (color: string) => `Цвет ${color}`,
    moveUp: "Выше",
    moveDown: "Ниже",
    readyTitle: "Готово для онлайн-записи",
    readyText: "Услуги с ценой и длительностью сразу попадают в календарь и онлайн-запись.",
    quickAddTitle: "Быстрый старт",
    quickAddText: "Добавьте свою услугу или выберите готовую из каталога ниже.",
    emptyTitle: "Услуг пока нет",
    emptyText: "Добавьте первую услугу с длительностью и ценой, чтобы клиенты могли записываться без переписки.",
    emptyAction: "Добавить первую услугу",
    catalogTitle: "Каталог популярных услуг",
    configuredLabel: "Настроено",
    categoriesLabel: "Категории",
    minutesLabel: "Длительность"
  },
  uk: {
    addFromCatalogFailed: "Не вдалося додати послугу з каталогу.",
    removeFromCatalogFailed: "Не вдалося прибрати послугу з вашого списку.",
    addedNamed: (name: string) => `"${name}" додано до вашого робочого списку.`,
    removedNamed: (name: string) => `"${name}" прибрано з вашого робочого списку.`,
    colorLabel: (color: string) => `Колір ${color}`,
    moveUp: "Вище",
    moveDown: "Нижче",
    readyTitle: "Готово для онлайн-запису",
    readyText: "Послуги з ціною та тривалістю одразу потрапляють у календар і онлайн-запис.",
    quickAddTitle: "Швидкий старт",
    quickAddText: "Додайте свою послугу або виберіть готову з каталогу нижче.",
    emptyTitle: "Послуг ще немає",
    emptyText: "Додайте першу послугу з тривалістю та ціною, щоб клієнти могли записуватися без переписки.",
    emptyAction: "Додати першу послугу",
    catalogTitle: "Каталог популярних послуг",
    configuredLabel: "Налаштовано",
    categoriesLabel: "Категорії",
    minutesLabel: "Тривалість"
  },
  en: {
    addFromCatalogFailed: "Could not add the service from the catalog.",
    removeFromCatalogFailed: "Could not remove the service from your list.",
    addedNamed: (name: string) => `"${name}" added to your working list.`,
    removedNamed: (name: string) => `"${name}" removed from your working list.`,
    colorLabel: (color: string) => `Color ${color}`,
    moveUp: "Move up",
    moveDown: "Move down",
    readyTitle: "Ready for online booking",
    readyText: "Services with price and duration are available in calendar and online booking right away.",
    quickAddTitle: "Quick start",
    quickAddText: "Add your own service or pick a ready-made one from the catalog below.",
    emptyTitle: "No services yet",
    emptyText: "Add the first service with duration and price so clients can book without messages.",
    emptyAction: "Add first service",
    catalogTitle: "Popular service catalog",
    configuredLabel: "Configured",
    categoriesLabel: "Categories",
    minutesLabel: "Duration"
  }
};

type ServiceExtras = typeof serviceExtrasBase.en;

const serviceExtras: Record<ProLanguage, ServiceExtras> = {
  ru: serviceExtrasBase.ru,
  uk: serviceExtrasBase.uk,
  en: serviceExtrasBase.en,
  fr: {
    addFromCatalogFailed: "Impossible d’ajouter le service depuis le catalogue.",
    removeFromCatalogFailed: "Impossible de retirer le service de votre liste.",
    addedNamed: (name: string) => `"${name}" a été ajouté à votre liste de travail.`,
    removedNamed: (name: string) => `"${name}" a été retiré de votre liste de travail.`,
    colorLabel: (color: string) => `Couleur ${color}`,
    moveUp: "Monter",
    moveDown: "Descendre",
    readyTitle: "Prêt pour la réservation en ligne",
    readyText: "Les services avec prix et durée sont disponibles dans le calendrier et la réservation en ligne.",
    quickAddTitle: "Démarrage rapide",
    quickAddText: "Ajoutez votre propre service ou choisissez un service prêt à l’emploi dans le catalogue.",
    emptyTitle: "Aucun service pour le moment",
    emptyText: "Ajoutez un premier service avec durée et prix pour que les clients puissent réserver sans messages.",
    emptyAction: "Ajouter le premier service",
    catalogTitle: "Catalogue des services populaires",
    configuredLabel: "Configuré",
    categoriesLabel: "Catégories",
    minutesLabel: "Durée"
  },
  pl: {
    addFromCatalogFailed: "Nie udało się dodać usługi z katalogu.",
    removeFromCatalogFailed: "Nie udało się usunąć usługi z listy.",
    addedNamed: (name: string) => `"${name}" dodano do listy roboczej.`,
    removedNamed: (name: string) => `"${name}" usunięto z listy roboczej.`,
    colorLabel: (color: string) => `Kolor ${color}`,
    moveUp: "Wyżej",
    moveDown: "Niżej",
    readyTitle: "Gotowe do rezerwacji online",
    readyText: "Usługi z ceną i czasem trwania są od razu dostępne w kalendarzu i rezerwacji online.",
    quickAddTitle: "Szybki start",
    quickAddText: "Dodaj własną usługę albo wybierz gotową z katalogu poniżej.",
    emptyTitle: "Nie masz jeszcze usług",
    emptyText: "Dodaj pierwszą usługę z czasem trwania i ceną, aby klienci mogli rezerwować bez wiadomości.",
    emptyAction: "Dodaj pierwszą usługę",
    catalogTitle: "Katalog popularnych usług",
    configuredLabel: "Skonfigurowano",
    categoriesLabel: "Kategorie",
    minutesLabel: "Czas trwania"
  },
  cs: {
    addFromCatalogFailed: "Službu z katalogu se nepodařilo přidat.",
    removeFromCatalogFailed: "Službu se nepodařilo odebrat z vašeho seznamu.",
    addedNamed: (name: string) => `"${name}" byla přidána do pracovního seznamu.`,
    removedNamed: (name: string) => `"${name}" byla odebrána z pracovního seznamu.`,
    colorLabel: (color: string) => `Barva ${color}`,
    moveUp: "Výše",
    moveDown: "Níže",
    readyTitle: "Připraveno pro online rezervace",
    readyText: "Služby s cenou a délkou jsou ihned dostupné v kalendáři a online rezervacích.",
    quickAddTitle: "Rychlý start",
    quickAddText: "Přidejte vlastní službu nebo vyberte hotovou službu z katalogu níže.",
    emptyTitle: "Zatím žádné služby",
    emptyText: "Přidejte první službu s délkou a cenou, aby si klienti mohli rezervovat bez zpráv.",
    emptyAction: "Přidat první službu",
    catalogTitle: "Katalog oblíbených služeb",
    configuredLabel: "Nastaveno",
    categoriesLabel: "Kategorie",
    minutesLabel: "Délka"
  },
  es: {
    addFromCatalogFailed: "No se pudo añadir el servicio desde el catálogo.",
    removeFromCatalogFailed: "No se pudo quitar el servicio de tu lista.",
    addedNamed: (name: string) => `"${name}" se añadió a tu lista de trabajo.`,
    removedNamed: (name: string) => `"${name}" se quitó de tu lista de trabajo.`,
    colorLabel: (color: string) => `Color ${color}`,
    moveUp: "Subir",
    moveDown: "Bajar",
    readyTitle: "Listo para reservas online",
    readyText: "Los servicios con precio y duración aparecen de inmediato en el calendario y en la reserva online.",
    quickAddTitle: "Inicio rápido",
    quickAddText: "Añade tu propio servicio o elige uno preparado del catálogo inferior.",
    emptyTitle: "Aún no hay servicios",
    emptyText: "Añade el primer servicio con duración y precio para que los clientes puedan reservar sin mensajes.",
    emptyAction: "Añadir primer servicio",
    catalogTitle: "Catálogo de servicios populares",
    configuredLabel: "Configurado",
    categoriesLabel: "Categorías",
    minutesLabel: "Duración"
  },
  de: {
    addFromCatalogFailed: "Die Leistung konnte nicht aus dem Katalog hinzugefügt werden.",
    removeFromCatalogFailed: "Die Leistung konnte nicht aus deiner Liste entfernt werden.",
    addedNamed: (name: string) => `"${name}" wurde deiner Arbeitsliste hinzugefügt.`,
    removedNamed: (name: string) => `"${name}" wurde aus deiner Arbeitsliste entfernt.`,
    colorLabel: (color: string) => `Farbe ${color}`,
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    readyTitle: "Bereit für Online-Buchungen",
    readyText: "Leistungen mit Preis und Dauer sind sofort im Kalender und in der Online-Buchung verfügbar.",
    quickAddTitle: "Schneller Start",
    quickAddText: "Füge eine eigene Leistung hinzu oder wähle unten eine fertige aus dem Katalog.",
    emptyTitle: "Noch keine Leistungen",
    emptyText: "Füge die erste Leistung mit Dauer und Preis hinzu, damit Kunden ohne Nachrichten buchen können.",
    emptyAction: "Erste Leistung hinzufügen",
    catalogTitle: "Katalog beliebter Leistungen",
    configuredLabel: "Eingerichtet",
    categoriesLabel: "Kategorien",
    minutesLabel: "Dauer"
  }
};

const emptyDraft = (category = "Без категории"): DraftService => ({
  name: "",
  category,
  durationMinutes: 60,
  price: 0,
  color: colorPalette[0]
});

function formatDuration(minutes = 60, labels = { minutes: "мин", hours: "ч" }) {
  if (minutes < 60) {
    return `${minutes} ${labels.minutes}`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ${labels.hours} ${rest} ${labels.minutes}` : `${hours} ${labels.hours}`;
}

function normalizeServices(services: ServiceRecord[]) {
  return [...services].sort((left, right) => {
    const orderDiff = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
    return orderDiff || left.createdAt.localeCompare(right.createdAt);
  });
}

function formatServicePrice(value: number, language: ProLanguage, currency?: string) {
  return new Intl.NumberFormat(localeBySiteLanguage[language], {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export default function ServicesView({ initialWorkspace, catalog, onboardingCta }: ServicesViewProps) {
  const { t, language } = useProLanguage();
  const copy = serviceExtras[language];
  const syncLabel = t.common.autosaving;
  const accountCurrency = initialWorkspace.professional.currency || "USD";
  const [services, setServices] = useState<ServiceRecord[]>(() => normalizeServices(initialWorkspace.services));
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES_KEY);
  const [customCategory, setCustomCategory] = useState("");
  const [draft, setDraft] = useState<DraftService>(() =>
    emptyDraft(initialWorkspace.business.categories[0] || catalog[0]?.title || t.common.noCategory)
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftService>(() => emptyDraft());
  const [serviceQuery, setServiceQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [expandedCatalogCategories, setExpandedCatalogCategories] = useState<Set<string>>(
    () => new Set([initialWorkspace.business.categories[0] || catalog[0]?.title || t.common.noCategory])
  );
  const [statusText, setStatusText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingServices, setIsRefreshingServices] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRecord | null>(null);

  const categories = useMemo(() => {
    return Array.from(
      new Set([
        ...initialWorkspace.business.categories,
        ...services.map((service) => service.category || t.common.noCategory),
        ...catalog.map((item) => item.title),
        t.common.noCategory
      ])
    ).sort(compareServiceCategories);
  }, [catalog, initialWorkspace.business.categories, services, t.common.allCategories, t.common.noCategory]);

  const visibleServices = useMemo(() => {
    const query = serviceQuery.trim().toLowerCase();
    const scopedServices =
      activeCategory === ALL_CATEGORIES_KEY
        ? services
        : services.filter((service) => (service.category || t.common.noCategory) === activeCategory);

    if (!query) {
      return scopedServices;
    }

    return scopedServices.filter((service) => {
      const localizedName = localizeServiceName(service.name, language, service.localizedName);
      const localizedCategory = service.category ? localizeCategoryName(service.category, language) : "";
      return `${service.name} ${localizedName} ${service.category || ""} ${localizedCategory}`
        .toLowerCase()
        .includes(query);
    });
  }, [activeCategory, language, serviceQuery, services, t.common.noCategory]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set(ALL_CATEGORIES_KEY, services.length);
    for (const service of services) {
      const category = service.category || t.common.noCategory;
      counts.set(category, (counts.get(category) || 0) + 1);
    }
    return counts;
  }, [services, t.common.noCategory]);
  const configuredServicesCount = useMemo(
    () =>
      services.filter(
        (service) =>
          Number.isFinite(service.price) &&
          service.price > 0 &&
          Number.isFinite(service.durationMinutes ?? Number.NaN) &&
          (service.durationMinutes ?? 0) > 0
      ).length,
    [services]
  );
  const averageDuration = useMemo(() => {
    if (!services.length) {
      return 0;
    }

    const total = services.reduce((sum, service) => sum + (service.durationMinutes || 60), 0);
    return Math.round(total / services.length);
  }, [services]);

  const servicesByCatalogKey = useMemo(
    () =>
      new Map(
        services.map((service) => [
          `${getServiceLocalizationKey(service.name)}::${(service.category || t.common.noCategory).trim().toLowerCase()}`,
          service
        ])
      ),
    [services, t.common.noCategory]
  );

  const catalogGroups = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();

    return sortCategoryTemplates(catalog)
      .map((category) => {
        const categoryServices = [...category.topSuggestions, ...category.popularServices]
          .map((service) => ({
            ...service,
            localizedLabel: localizeServiceName(service.name, language, service.localizedName),
            localizationKey: getServiceLocalizationKey(service.name)
          }))
          .filter(
            (service, index, list) => list.findIndex((item) => item.localizationKey === service.localizationKey) === index
          )
          .filter(
            (service) =>
              !query ||
              `${service.name} ${service.localizedLabel} ${category.title} ${localizeCategoryName(category.title, language)}`
                .toLowerCase()
                .includes(query)
          );

        return {
          category: category.title,
          services: categoryServices
        };
      })
      .filter((group) => group.services.length > 0);
  }, [catalog, catalogQuery, language]);

  async function reloadServices() {
    setIsRefreshingServices(true);

    try {
      const response = await fetch("/api/pro/services");
      const payload = await response.json();
      if (response.ok && Array.isArray(payload.workspace?.services)) {
        setServices(normalizeServices(payload.workspace.services));
      }
    } finally {
      setIsRefreshingServices(false);
    }
  }

  async function persistOrder(nextServices: ServiceRecord[]) {
    await fetch("/api/pro/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceIds: nextServices.map((service) => service.id) })
    });
  }

  async function saveManualService() {
    if (!draft.name.trim()) {
      setStatusText(t.services.enterName);
      return;
    }

    setIsSaving(true);
    setStatusText("");

    const response = await fetch("/api/pro/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, source: "custom" })
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatusText(payload.error || t.services.enterName);
      setIsSaving(false);
      return;
    }

    await reloadServices();
    setDraft(emptyDraft(draft.category));
    setStatusText(t.services.added);
    setIsSaving(false);
  }

  async function saveEditedService() {
    if (!editId || !editDraft.name.trim()) {
      setStatusText(t.services.enterName);
      return;
    }

    setIsSaving(true);
    setStatusText("");

    try {
      const originalService = services.find((service) => service.id === editId);
      const localizedName = {
        ...(originalService?.localizedName || editDraft.localizedName || {}),
        [language]: editDraft.name.trim()
      };
      const response = await fetch("/api/pro/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: editId,
          ...editDraft,
          name: isCanonicalServiceLanguage(language) ? editDraft.name.trim() : originalService?.name || editDraft.name.trim(),
          localizedName
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatusText(payload.error || t.services.enterName);
        return;
      }

      if (payload?.id) {
        setServices((current) =>
          normalizeServices(current.map((service) => (service.id === payload.id ? payload : service)))
        );
      } else {
        await reloadServices();
      }

      setEditId(null);
      setStatusText(t.services.updated);
    } catch {
      setStatusText(t.services.enterName);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeService() {
    if (!serviceToDelete) {
      return;
    }

    setIsSaving(true);
    const response = await fetch(`/api/pro/services?serviceId=${encodeURIComponent(serviceToDelete.id)}`, {
      method: "DELETE"
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatusText(payload.error || t.services.removeFromMine);
      setIsSaving(false);
      return;
    }

    await reloadServices();
    setServiceToDelete(null);
    setStatusText(t.services.removed);
    setIsSaving(false);
  }

  async function moveService(serviceId: string, direction: -1 | 1) {
    const index = services.findIndex((service) => service.id === serviceId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= services.length) {
      return;
    }

    const nextServices = [...services];
    const [picked] = nextServices.splice(index, 1);
    nextServices.splice(nextIndex, 0, picked);
    const ordered = nextServices.map((service, order) => ({ ...service, sortOrder: order }));
    setServices(ordered);
    await persistOrder(ordered);
  }

  async function addCatalogService(service: {
    name: string;
    localizedName?: ServiceRecord["localizedName"];
    category: string;
    durationMinutes?: number;
    price?: number;
    localizedLabel?: string;
  }) {
    setIsSaving(true);
    setStatusText("");

    try {
      const response = await fetch("/api/pro/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: service.name,
          localizedName: service.localizedName,
          category: service.category,
          durationMinutes: service.durationMinutes || 60,
          price: service.price || 0,
          color: colorPalette[services.length % colorPalette.length],
          source: "catalog"
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatusText(payload.error || copy.addFromCatalogFailed);
        return;
      }

      if (payload?.id) {
        setServices((current) => normalizeServices([...current.filter((item) => item.id !== payload.id), payload]));
      } else {
        await reloadServices();
      }

      setStatusText(copy.addedNamed(service.localizedLabel || localizeServiceName(service.name, language)));
    } catch {
      setStatusText(copy.addFromCatalogFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCatalogService(service: ServiceRecord, localizedLabel?: string) {
    setIsSaving(true);
    setStatusText("");

    try {
      const response = await fetch(`/api/pro/services?serviceId=${encodeURIComponent(service.id)}`, {
        method: "DELETE"
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatusText(payload.error || copy.removeFromCatalogFailed);
        return;
      }

      setServices((current) => current.filter((item) => item.id !== service.id));
      setStatusText(copy.removedNamed(localizedLabel || localizeServiceName(service.name, language, service.localizedName)));
    } catch {
      setStatusText(copy.removeFromCatalogFailed);
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(service: ServiceRecord) {
    setEditId(service.id);
    setEditDraft({
      name: localizeServiceName(service.name, language, service.localizedName),
      localizedName: service.localizedName,
      category: service.category || t.common.noCategory,
      durationMinutes: service.durationMinutes || 60,
      price: service.price || 0,
      color: service.color || colorPalette[0]
    });
  }

  function addCategory() {
    const nextCategory = customCategory.trim();
    if (!nextCategory) {
      return;
    }

    setActiveCategory(nextCategory);
    setDraft((current) => ({ ...current, category: nextCategory }));
    setCustomCategory("");
    setStatusText(`${t.services.category}: "${nextCategory}"`);
  }

  function toggleCatalogCategory(category: string) {
    setExpandedCatalogCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  async function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = services.findIndex((service) => service.id === draggedId);
    const targetIndex = services.findIndex((service) => service.id === targetId);

    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedId(null);
      return;
    }

    const nextServices = [...services];
    const [picked] = nextServices.splice(draggedIndex, 1);
    nextServices.splice(targetIndex, 0, picked);
    const ordered = nextServices.map((service, order) => ({ ...service, sortOrder: order }));
    setServices(ordered);
    setDraggedId(null);
    await persistOrder(ordered);
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.servicesShell}`}>
      <ProSidebar
        active="services"
        professionalId={initialWorkspace.professional.id}
        canManageStaff={initialWorkspace.membership.scope === "owner"}
      />

      <section className={styles.servicesPage}>
        <ProWorkspaceHeader
          businessName={initialWorkspace.business.name}
          viewerName={`${initialWorkspace.professional.firstName} ${initialWorkspace.professional.lastName}`.trim() || initialWorkspace.professional.email}
          viewerAvatarUrl={initialWorkspace.professional.avatarUrl}
          viewerInitials={`${initialWorkspace.professional.firstName?.[0] ?? ""}${initialWorkspace.professional.lastName?.[0] ?? ""}`.toUpperCase() || "RZ"}
          isPremium={isProPremiumActive(initialWorkspace.professional)}
          publicBookingUrl={initialWorkspace.business.publicBookingUrl}
          publicBookingEnabled={initialWorkspace.business.allowOnlineBooking === true}
          canTogglePublicBooking={initialWorkspace.membership.scope === "owner"}
          onboardingCta={onboardingCta}
        />

        <header className={styles.servicesHeroCompact}>
          <div>
            <p className={styles.eyebrow}>{t.services.kicker}</p>
            <h1>{t.services.title}</h1>
            <p>{t.services.subtitle}</p>
          </div>
          <div className={styles.servicesHeroActions}>
            {isRefreshingServices ? <span className={styles.servicesSyncPill}>{syncLabel}</span> : null}
            <span>{services.length} {t.services.count}</span>
            <button type="button" className={styles.primaryButton} onClick={() => document.getElementById("new-service")?.scrollIntoView({ behavior: "smooth" })}>
              {t.common.add}
            </button>
          </div>
        </header>

        <section className={styles.servicesQuickStats} aria-label={copy.readyTitle}>
          <article>
            <span>{copy.configuredLabel}</span>
            <strong>{configuredServicesCount}/{services.length}</strong>
            <small>{copy.readyText}</small>
          </article>
          <article>
            <span>{copy.categoriesLabel}</span>
            <strong>{Math.max(0, categoryCounts.size - 1)}</strong>
            <small>{activeCategory === ALL_CATEGORIES_KEY ? t.common.allCategories : localizeCategoryName(activeCategory, language)}</small>
          </article>
          <article>
            <span>{copy.minutesLabel}</span>
            <strong>{averageDuration ? formatDuration(averageDuration, t.common) : "0"}</strong>
            <small>{copy.quickAddText}</small>
          </article>
        </section>

        {statusText ? <div className={styles.calendarInlineStatus}>{statusText}</div> : null}

        <div className={styles.servicesCompactGrid}>
          <aside className={styles.servicesCategoryPanel}>
            <h2>{t.services.categories}</h2>
            <div className={styles.servicesCategoryList}>
              {[ALL_CATEGORIES_KEY, ...categories]
                .filter((category) => category === ALL_CATEGORIES_KEY || categoryCounts.has(category))
                .map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={activeCategory === category ? styles.servicesCategoryActive : ""}
                    onClick={() => setActiveCategory(category)}
                  >
                    <span>
                      {category === ALL_CATEGORIES_KEY
                        ? t.common.allCategories
                        : localizeCategoryName(category, language)}
                    </span>
                    <em>{categoryCounts.get(category) || 0}</em>
                  </button>
                ))}
            </div>
            <div className={styles.servicesCategoryAddCompact}>
              <input
                className={styles.input}
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                placeholder={t.services.newCategory}
              />
              <button type="button" className={styles.calendarSecondaryAction} onClick={addCategory}>
                +
              </button>
            </div>
          </aside>

          <section className={styles.servicesMenuPanel}>
            <div className={styles.servicesMenuHeader}>
              <h2>{t.services.myServices}</h2>
            </div>
            <div className={styles.servicesMenuToolbar}>
              <input
                className={styles.input}
                value={serviceQuery}
                onChange={(event) => setServiceQuery(event.target.value)}
                placeholder={t.services.searchPlaceholder}
              />
              <button type="button" className={styles.calendarSecondaryAction} onClick={() => setActiveCategory(ALL_CATEGORIES_KEY)}>
                {t.common.allServices}
              </button>
            </div>

            <div className={styles.servicesMenuList}>
              {isRefreshingServices && visibleServices.length === 0 ? (
                <div className={styles.servicesSkeletonList} aria-hidden="true">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className={styles.servicesSkeletonRow}>
                      <span className={styles.mobileSkeletonDot} />
                      <span className={styles.mobileSkeletonLine} />
                      <span className={styles.mobileSkeletonLineShort} />
                    </div>
                  ))}
                </div>
              ) : visibleServices.length === 0 ? (
                <div className={styles.servicesEmptyState}>
                  <strong>{serviceQuery.trim() ? t.services.searchPlaceholder : copy.emptyTitle}</strong>
                  <span>{serviceQuery.trim() ? t.services.enterName : copy.emptyText}</span>
                  <button type="button" className={styles.primaryButton} onClick={() => document.getElementById("new-service")?.scrollIntoView({ behavior: "smooth" })}>
                    {copy.emptyAction}
                  </button>
                </div>
              ) : null}

              {visibleServices.map((service, index) => {
                const isEditing = editId === service.id;

                return (
                  <article
                    key={service.id}
                    className={`${styles.serviceMenuRow} ${draggedId === service.id ? styles.serviceMenuRowDragging : ""}`}
                    draggable
                    onDragStart={() => setDraggedId(service.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => void handleDrop(service.id)}
                  >
                    <div className={styles.serviceDragHandle} aria-hidden="true">⋮⋮</div>
                    <div className={styles.serviceColorRail} style={{ background: service.color || colorPalette[0] }} />

                    {isEditing ? (
                      <div className={styles.serviceEditGrid}>
                        <input
                          className={styles.input}
                          value={editDraft.name}
                          onChange={(event) => setEditDraft((current) => ({
                            ...current,
                            name: event.target.value,
                            localizedName: {
                              ...(current.localizedName || {}),
                              [language]: event.target.value
                            }
                          }))}
                          placeholder={t.services.name}
                        />
                        <select
                          className={styles.select}
                          value={editDraft.category}
                          onChange={(event) => setEditDraft((current) => ({ ...current, category: event.target.value }))}
                        >
                          {categories
                            .map((category) => (
                              <option key={category} value={category}>
                                {localizeCategoryName(category, language)}
                              </option>
                            ))}
                        </select>
                        <label className={styles.serviceMiniField}>
                          <span>{t.common.minutes}</span>
                          <input
                            className={styles.input}
                            type="number"
                            min="5"
                            step="5"
                            value={editDraft.durationMinutes}
                            onChange={(event) => setEditDraft((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}
                          />
                        </label>
                        <label className={styles.serviceMiniField}>
                          <span>{t.services.price}</span>
                          <input
                            className={styles.input}
                            type="number"
                            min="0"
                            value={editDraft.price}
                            onChange={(event) => setEditDraft((current) => ({ ...current, price: Number(event.target.value) }))}
                          />
                        </label>
                        <div className={styles.serviceColorPicker}>
                          {colorPalette.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={editDraft.color === color ? styles.serviceColorActive : ""}
                              style={{ background: color }}
                              onClick={() => setEditDraft((current) => ({ ...current, color }))}
                              aria-label={copy.colorLabel(color)}
                            />
                          ))}
                        </div>
                        <div className={styles.serviceRowActions}>
                          <button type="button" className={styles.calendarSecondaryAction} onClick={() => setEditId(null)}>
                            {t.common.cancel}
                          </button>
                          <button type="button" className={styles.primaryButton} disabled={isSaving} onClick={() => void saveEditedService()}>
                            {t.common.save}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.serviceMenuMain}>
                          <strong>{localizeServiceName(service.name, language, service.localizedName)}</strong>
                          <span>
                            {(service.category ? localizeCategoryName(service.category, language) : t.common.noCategory)} ·{" "}
                            {formatDuration(service.durationMinutes || 60, t.common)}
                          </span>
                        </div>
                        <strong className={styles.serviceMenuPrice}>{formatServicePrice(service.price || 0, language, accountCurrency)}</strong>
                        <div className={styles.serviceRowActions}>
                          <button type="button" onClick={() => void moveService(service.id, -1)} disabled={index === 0} title={copy.moveUp}>↑</button>
                          <button type="button" onClick={() => void moveService(service.id, 1)} disabled={index === visibleServices.length - 1} title={copy.moveDown}>↓</button>
                          <button type="button" onClick={() => startEdit(service)}>{t.common.edit}</button>
                          <button type="button" className={styles.dangerTextButton} disabled={isSaving} onClick={() => setServiceToDelete(service)}>
                            {t.common.delete}
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <section id="new-service" className={styles.servicesAddPanel}>
          <div className={styles.servicesCardHeader}>
            <div>
              <h2>{t.services.addBlockTitle}</h2>
              <p>{t.services.addBlockText}</p>
            </div>
            <span className={styles.servicesAddBadge}>{copy.quickAddTitle}</span>
          </div>

          <div className={styles.servicesAddGrid}>
            <div className={styles.servicesToolCard}>
              <h2>{t.services.ownService}</h2>
              <div className={styles.servicesCompactFields}>
                <label>
                  <span>{t.services.name}</span>
                  <input
                    className={styles.input}
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder={t.services.serviceNamePlaceholder}
                  />
                </label>
                <label>
                  <span>{t.services.category}</span>
                  <select
                    className={styles.select}
                    value={draft.category}
                    onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                  >
                    {categories
                      .map((category) => (
                        <option key={category} value={category}>
                          {localizeCategoryName(category, language)}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  <span>{t.services.duration}</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="5"
                    step="5"
                    value={draft.durationMinutes}
                    onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  <span>{t.services.price}</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) => setDraft((current) => ({ ...current, price: Number(event.target.value) }))}
                  />
                </label>
              </div>
              <div className={styles.serviceColorPicker}>
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={draft.color === color ? styles.serviceColorActive : ""}
                    style={{ background: color }}
                    onClick={() => setDraft((current) => ({ ...current, color }))}
                    aria-label={copy.colorLabel(color)}
                  />
                ))}
              </div>
              <button type="button" className={styles.primaryButton} disabled={isSaving} onClick={() => void saveManualService()}>
                {t.services.addService}
              </button>
            </div>

            <div className={styles.servicesCatalogCompact}>
              <div className={styles.servicesCatalogTitle}>
                <strong>{copy.catalogTitle}</strong>
                <span>{catalogGroups.reduce((count, group) => count + group.services.length, 0)} {t.services.count}</span>
              </div>
              <div className={styles.servicesMenuToolbar}>
                <input
                  className={styles.input}
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder={t.services.catalogSearch}
                />
              </div>

              <div className={styles.servicesCatalogGroups}>
                {catalogGroups.map((group) => {
                  const isExpanded = expandedCatalogCategories.has(group.category) || catalogQuery.trim().length > 0;

                  return (
                    <section key={group.category} className={styles.catalogCategoryGroup}>
                      <button
                        type="button"
                        className={styles.catalogCategoryHeader}
                        onClick={() => toggleCatalogCategory(group.category)}
                      >
                        <span>{localizeCategoryName(group.category, language)}</span>
                        <em>{group.services.length} {t.services.count}</em>
                        <strong>{isExpanded ? "−" : "+"}</strong>
                      </button>

                      {isExpanded ? (
                        <div className={styles.servicesCatalogList}>
                          {group.services.map((service) => {
                            const existingService =
                              servicesByCatalogKey.get(
                                `${service.localizationKey}::${group.category.trim().toLowerCase()}`
                              ) ||
                              services.find((item) => getServiceLocalizationKey(item.name) === service.localizationKey) ||
                              null;
                            const exists = Boolean(existingService);

                            return (
                              <button
                                key={`${group.category}-${service.localizationKey}`}
                                type="button"
                                className={`${styles.catalogServiceLine} ${exists ? styles.catalogServiceLineActive : ""}`}
                                disabled={isSaving}
                                onClick={() =>
                                  exists && existingService
                                    ? void removeCatalogService(existingService, service.localizedLabel)
                                    : void addCatalogService({ ...service, category: group.category, localizedLabel: service.localizedLabel })
                                }
                              >
                                <span>{service.localizedLabel}</span>
                                <em>{formatDuration(service.durationMinutes || 60, t.common)} · {formatServicePrice(service.price || 0, language, accountCurrency)}</em>
                                <strong>{exists ? "−" : "+"}</strong>
                                <small>{exists ? t.services.inMyServices : t.services.addFromCatalog}</small>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </section>

      {serviceToDelete ? (
        <div className={styles.servicesModalOverlay} role="dialog" aria-modal="true">
          <section className={styles.servicesDeleteModal}>
            <div>
              <p className={styles.eyebrow}>{t.services.deleteKicker}</p>
              <h2>{t.services.deleteTitle}</h2>
              <p>{t.services.deleteText}</p>
            </div>
            <div className={styles.servicesDeletePreview}>
              <span style={{ background: serviceToDelete.color || colorPalette[0] }} />
              <strong>{localizeServiceName(serviceToDelete.name, language)}</strong>
              <em>
                {(serviceToDelete.category ? localizeCategoryName(serviceToDelete.category, language) : t.common.noCategory)} ·{" "}
                {formatDuration(serviceToDelete.durationMinutes || 60, t.common)}
              </em>
            </div>
            <div className={styles.servicesDeleteActions}>
              <button type="button" className={styles.calendarSecondaryAction} onClick={() => setServiceToDelete(null)}>
                {t.common.cancel}
              </button>
              <button type="button" className={styles.dangerButton} disabled={isSaving} onClick={() => void removeService()}>
                {t.services.removeFromMine}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
