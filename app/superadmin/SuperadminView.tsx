"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./superadmin.module.css";
import type {
  SuperadminPhotoRecord,
  SuperadminServiceRecord,
  SuperadminUserRecord
} from "../../lib/admin-data";
import type { GlobalCatalogItem } from "../../lib/global-service-catalog";
import { categoryOptions } from "../../lib/service-templates";

type SuperadminViewProps = {
  adminEmail: string;
  initialUsers: SuperadminUserRecord[];
  initialServices: SuperadminServiceRecord[];
  initialPhotos: SuperadminPhotoRecord[];
  initialCatalog: GlobalCatalogItem[];
};

type CatalogDraft = {
  id?: string;
  category: string;
  groupKey: "topSuggestions" | "popularServices";
  name: string;
  localizedNameRu: string;
  localizedNameUk: string;
  localizedNameEn: string;
  durationMinutes: number;
  price: number;
  sortOrder: number;
};

type ServiceCatalogMoveDraft = {
  category: string;
  groupKey: "topSuggestions" | "popularServices";
};

type GroupedServices = {
  businessId: string;
  businessName: string;
  items: SuperadminServiceRecord[];
};

type GroupedPhotos = {
  businessId: string;
  businessName: string;
  items: SuperadminPhotoRecord[];
};

const defaultCatalogDraft: CatalogDraft = {
  category: categoryOptions[0] || "Другая",
  groupKey: "topSuggestions",
  name: "",
  localizedNameRu: "",
  localizedNameUk: "",
  localizedNameEn: "",
  durationMinutes: 60,
  price: 0,
  sortOrder: 0
};

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

function groupServices(items: SuperadminServiceRecord[]): GroupedServices[] {
  const map = new Map<string, GroupedServices>();
  for (const item of items) {
    const existing = map.get(item.businessId) ?? {
      businessId: item.businessId,
      businessName: item.businessName,
      items: []
    };
    existing.items.push(item);
    map.set(item.businessId, existing);
  }
  return Array.from(map.values()).sort((left, right) => left.businessName.localeCompare(right.businessName));
}

function groupPhotos(items: SuperadminPhotoRecord[]): GroupedPhotos[] {
  const map = new Map<string, GroupedPhotos>();
  for (const item of items) {
    const existing = map.get(item.businessId) ?? {
      businessId: item.businessId,
      businessName: item.businessName,
      items: []
    };
    existing.items.push(item);
    map.set(item.businessId, existing);
  }
  return Array.from(map.values()).sort((left, right) => left.businessName.localeCompare(right.businessName));
}

function getScopeLabel(scope: SuperadminUserRecord["scope"]) {
  switch (scope) {
    case "owner":
      return "Владелец";
    case "member":
      return "Сотрудник";
    case "pending":
      return "Ожидает подтверждения";
    case "unassigned":
      return "Не завершил подключение";
    default:
      return scope;
  }
}

export default function SuperadminView({
  adminEmail,
  initialUsers,
  initialServices,
  initialPhotos,
  initialCatalog
}: SuperadminViewProps) {
  const [users, setUsers] = useState(initialUsers);
  const [services, setServices] = useState(initialServices);
  const [photos, setPhotos] = useState(initialPhotos);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [userQuery, setUserQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [photoQuery, setPhotoQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0]?.professionalId || "");
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, { bookingCreditsTotal: string; walletBalance: string }>>(
    () =>
      Object.fromEntries(
        initialUsers.map((user) => [
          user.professionalId,
          {
            bookingCreditsTotal: String(user.bookingCreditsTotal),
            walletBalance: String(user.walletBalance)
          }
        ])
      )
  );
  const [catalogDraft, setCatalogDraft] = useState<CatalogDraft>(defaultCatalogDraft);
  const [serviceCatalogDrafts, setServiceCatalogDrafts] = useState<Record<string, ServiceCatalogMoveDraft>>(() =>
    Object.fromEntries(
      initialServices.map((service) => [
        service.id,
        {
          category: service.category || categoryOptions[0] || "Другая",
          groupKey: "topSuggestions"
        }
      ])
    )
  );

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.fullName, user.email, user.phone, user.businessName, user.role]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [userQuery, users]);

  useEffect(() => {
    if (!filteredUsers.some((user) => user.professionalId === selectedUserId)) {
      setSelectedUserId(filteredUsers[0]?.professionalId || "");
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser =
    filteredUsers.find((user) => user.professionalId === selectedUserId) ??
    users.find((user) => user.professionalId === selectedUserId) ??
    null;

  const customServices = useMemo(
    () => services.filter((service) => service.source === "custom"),
    [services]
  );

  const filteredServices = useMemo(() => {
    const query = serviceQuery.trim().toLowerCase();
    if (!query) return customServices;
    return customServices.filter((service) =>
      [service.name, service.category, service.businessName, service.addedByName]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [serviceQuery, customServices]);

  const groupedServices = useMemo(() => groupServices(filteredServices), [filteredServices]);
  const pendingServices = useMemo(
    () => filteredServices.filter((service) => service.moderationStatus === "pending" && !service.isBlocked),
    [filteredServices]
  );
  const approvedServices = useMemo(
    () => filteredServices.filter((service) => service.moderationStatus === "approved" && !service.isBlocked),
    [filteredServices]
  );
  const blockedServices = useMemo(
    () => filteredServices.filter((service) => service.isBlocked),
    [filteredServices]
  );

  const filteredPhotos = useMemo(() => {
    const query = photoQuery.trim().toLowerCase();
    if (!query) return photos;
    return photos.filter((photo) =>
      [photo.businessName, photo.caption, photo.addedByName]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [photoQuery, photos]);

  const groupedPhotos = useMemo(() => groupPhotos(filteredPhotos), [filteredPhotos]);

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((item) =>
      [item.category, item.name, item.groupKey, item.localizedName?.ru, item.localizedName?.uk, item.localizedName?.en]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [catalogQuery, catalog]);

  async function withStatus(task: () => Promise<void>, successText: string) {
    setIsBusy(true);
    setStatus("");
    try {
      await task();
      setStatus(successText);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось выполнить действие.");
    } finally {
      setIsBusy(false);
    }
  }

  async function impersonate(professionalId: string) {
    await withStatus(async () => {
      const response = await fetch("/api/superadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось войти под пользователем.");
      }
      window.location.href = payload.redirectTo || "/pro/calendar";
    }, "Открываем панель пользователя...");
  }

  async function saveBalances(user: SuperadminUserRecord) {
    const draft = balanceDrafts[user.professionalId];
    await withStatus(async () => {
      const response = await fetch("/api/superadmin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId: user.professionalId,
          bookingCreditsTotal: Number(draft?.bookingCreditsTotal ?? user.bookingCreditsTotal),
          walletBalance: Number(draft?.walletBalance ?? user.walletBalance)
        })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить баланс.");
      }
      setUsers((current) =>
        current.map((item) =>
          item.professionalId === user.professionalId
            ? {
                ...item,
                bookingCreditsTotal: Number(draft?.bookingCreditsTotal ?? item.bookingCreditsTotal),
                walletBalance: Number(draft?.walletBalance ?? item.walletBalance)
              }
            : item
        )
      );
    }, `Баланс пользователя ${user.fullName} обновлен.`);
  }

  async function deleteUser(user: SuperadminUserRecord) {
    await withStatus(async () => {
      const response = await fetch(
        `/api/superadmin/users?professionalId=${encodeURIComponent(user.professionalId)}`,
        { method: "DELETE" }
      );
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось удалить пользователя.");
      }

      setUsers((current) => current.filter((item) => item.professionalId !== user.professionalId));
      setServices((current) =>
        current.filter(
          (item) =>
            item.addedByProfessionalId !== user.professionalId && item.businessId !== user.businessId
        )
      );
      setPhotos((current) =>
        current.filter(
          (item) =>
            item.addedByProfessionalId !== user.professionalId && item.businessId !== user.businessId
        )
      );
      setBalanceDrafts((current) => {
        const next = { ...current };
        delete next[user.professionalId];
        return next;
      });
    }, `Пользователь ${user.fullName} удалён.`);
  }

  async function toggleServiceBlocked(service: SuperadminServiceRecord, nextBlocked: boolean) {
    await withStatus(async () => {
      const response = await fetch("/api/superadmin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, isBlocked: nextBlocked })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить статус услуги.");
      }
      setServices((current) =>
        current.map((item) =>
          item.id === service.id
            ? {
                ...item,
                isBlocked: nextBlocked
              }
            : item
        )
      );
    }, nextBlocked ? "Услуга заблокирована." : "Блокировка услуги снята.");
  }

  async function setServiceModeration(service: SuperadminServiceRecord, moderationStatus: "pending" | "approved") {
    await withStatus(async () => {
      const response = await fetch("/api/superadmin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate",
          serviceId: service.id,
          moderationStatus
        })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить модерацию услуги.");
      }
      setServices((current) =>
        current.map((item) =>
          item.id === service.id
            ? {
                ...item,
                moderationStatus,
                moderatedAt: moderationStatus === "approved" ? new Date().toISOString() : undefined
              }
            : item
        )
      );
    }, moderationStatus === "approved" ? "Услуга одобрена для публичного сайта." : "Услуга снова отправлена на модерацию.");
  }

  async function promoteServiceToCatalog(service: SuperadminServiceRecord) {
    const draft = serviceCatalogDrafts[service.id] ?? {
      category: service.category || categoryOptions[0] || "Другая",
      groupKey: "topSuggestions" as const
    };

    await withStatus(async () => {
      const response = await fetch("/api/superadmin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "promote_to_catalog",
          serviceId: service.id,
          category: draft.category,
          groupKey: draft.groupKey
        })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось перенести услугу в шаблонный каталог.");
      }

      const catalogResponse = await fetch("/api/superadmin/catalog");
      const catalogPayload = await readJson(catalogResponse);
      if (catalogResponse.ok && Array.isArray(catalogPayload.items)) {
        setCatalog(catalogPayload.items);
      }

      setServices((current) =>
        current.map((item) =>
          item.id === service.id
            ? {
                ...item,
                moderationStatus: "approved",
                moderatedAt: new Date().toISOString()
              }
            : item
        )
      );
    }, "Услуга добавлена в шаблонный каталог и одобрена для публичного сайта.");
  }

  function renderServiceRow(service: SuperadminServiceRecord) {
    const catalogDraft = serviceCatalogDrafts[service.id] ?? {
      category: service.category || categoryOptions[0] || "Другая",
      groupKey: "topSuggestions" as const
    };

    return (
      <div key={service.id} className={styles.tableRow}>
        <div>
          <strong>{service.name}</strong>
          <div className={styles.rowMeta}>
            {service.category} · {service.durationMinutes} мин · {service.price}
          </div>
          <div className={styles.serviceBadges}>
            <span className={service.moderationStatus === "pending" ? styles.badgePending : styles.badgeActive}>
              {service.moderationStatus === "pending" ? "Ждёт модерации" : "Публично одобрена"}
            </span>
            {service.isBlocked ? <span className={styles.badgeBlocked}>Заблокирована</span> : null}
          </div>
        </div>
        <div className={styles.serviceMetaColumn}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => void impersonate(service.addedByProfessionalId)}
          >
            {service.addedByName}
          </button>
          <span className={styles.rowMeta}>{service.businessName}</span>
        </div>
        <div className={styles.rowActions}>
          <div className={styles.catalogInlineControls}>
            <select
              className={styles.select}
              value={catalogDraft.category}
              onChange={(event) =>
                setServiceCatalogDrafts((current) => ({
                  ...current,
                  [service.id]: {
                    ...catalogDraft,
                    category: event.target.value
                  }
                }))
              }
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={catalogDraft.groupKey}
              onChange={(event) =>
                setServiceCatalogDrafts((current) => ({
                  ...current,
                  [service.id]: {
                    ...catalogDraft,
                    groupKey: event.target.value === "popularServices" ? "popularServices" : "topSuggestions"
                  }
                }))
              }
            >
              <option value="topSuggestions">Основные</option>
              <option value="popularServices">Популярные</option>
            </select>
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void setServiceModeration(service, "approved")}
            disabled={isBusy || (service.moderationStatus === "approved" && !service.isBlocked)}
          >
            Утвердить
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void promoteServiceToCatalog(service)}
            disabled={isBusy}
          >
            В шаблон
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void toggleServiceBlocked(service, !service.isBlocked)}
            disabled={isBusy}
          >
            {service.isBlocked ? "Разблокировать" : "Блокировать"}
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => void deleteService(service.id)}
            disabled={isBusy}
          >
            Удалить
          </button>
        </div>
      </div>
    );
  }

  async function deleteService(serviceId: string) {
    await withStatus(async () => {
      const response = await fetch(`/api/superadmin/services?serviceId=${encodeURIComponent(serviceId)}`, {
        method: "DELETE"
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось удалить услугу.");
      }
      setServices((current) => current.filter((item) => item.id !== serviceId));
    }, "Услуга удалена.");
  }

  async function togglePhotoBlocked(photo: SuperadminPhotoRecord, nextBlocked: boolean) {
    await withStatus(async () => {
      const response = await fetch("/api/superadmin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: photo.businessId,
          photoId: photo.id,
          isBlocked: nextBlocked
        })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить статус фото.");
      }
      setPhotos((current) =>
        current.map((item) =>
          item.id === photo.id && item.businessId === photo.businessId
            ? { ...item, status: nextBlocked ? "blocked" : "active" }
            : item
        )
      );
    }, nextBlocked ? "Фото заблокировано." : "Фото снова активно.");
  }

  async function deletePhoto(photo: SuperadminPhotoRecord) {
    await withStatus(async () => {
      const response = await fetch(
        `/api/superadmin/photos?businessId=${encodeURIComponent(photo.businessId)}&photoId=${encodeURIComponent(photo.id)}`,
        { method: "DELETE" }
      );
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось удалить фото.");
      }
      setPhotos((current) =>
        current.filter((item) => !(item.id === photo.id && item.businessId === photo.businessId))
      );
    }, "Фото удалено.");
  }

  async function saveCatalogItem(draft: CatalogDraft) {
    await withStatus(async () => {
      const response = await fetch("/api/superadmin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          localizedName: {
            ru: draft.localizedNameRu.trim(),
            uk: draft.localizedNameUk.trim(),
            en: draft.localizedNameEn.trim()
          }
        })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось сохранить элемент каталога.");
      }
      const item = payload.item as GlobalCatalogItem;
      setCatalog((current) => {
        const exists = current.some((entry) => entry.id === item.id);
        return exists
          ? current.map((entry) => (entry.id === item.id ? item : entry))
          : [...current, item];
      });
      setCatalogDraft(defaultCatalogDraft);
    }, "Корневой каталог обновлён.");
  }

  async function seedCatalogDefaults(force = false) {
    await withStatus(async () => {
      const response = await fetch("/api/superadmin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seed_defaults",
          force
        })
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось загрузить базовые услуги каталога.");
      }
      if (Array.isArray(payload.items)) {
        setCatalog(payload.items);
      }
    }, force ? "Базовый каталог принудительно обновлён." : "Базовый каталог загружен.");
  }

  async function deleteCatalogItem(itemId: string) {
    await withStatus(async () => {
      const response = await fetch(`/api/superadmin/catalog?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE"
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось удалить элемент каталога.");
      }
      setCatalog((current) => current.filter((item) => item.id !== itemId));
    }, "Элемент каталога удалён.");
  }

  async function logout() {
    await withStatus(async () => {
      await fetch("/api/superadmin/logout", { method: "POST" });
      window.location.href = "/superadmin/login";
    }, "Выходим...");
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Timviz Superadmin</p>
          <h1>Управление платформой</h1>
          <p className={styles.heroText}>
            Большие списки без хаоса: быстрый поиск пользователей, отдельная карточка действий, сгруппированные услуги и фото.
          </p>
        </div>
        <div className={styles.heroActions}>
          <div className={styles.adminBadge}>{adminEmail}</div>
          <button type="button" className={styles.secondaryButton} onClick={() => void logout()}>
            Выйти
          </button>
        </div>
      </section>

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <strong>{users.length}</strong>
          <span>Пользователей</span>
        </article>
        <article className={styles.metricCard}>
          <strong>{customServices.length}</strong>
          <span>Услуг</span>
        </article>
        <article className={styles.metricCard}>
          <strong>{photos.length}</strong>
          <span>Фотографий</span>
        </article>
        <article className={styles.metricCard}>
          <strong>{catalog.length}</strong>
          <span>Элементов root-каталога</span>
        </article>
      </section>

      {status ? <div className={styles.statusBar}>{status}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Пользователи</h2>
            <p>Слева быстрый список, справа карточка, где уже можно менять балансы, входить под пользователем или удалить его.</p>
          </div>
          <input
            className={styles.searchInput}
            placeholder="Поиск по имени, email, телефону, роли или бизнесу"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
          />
        </div>

        <div className={styles.entityLayout}>
          <div className={styles.entityList}>
            {filteredUsers.map((user) => (
              <button
                key={user.professionalId}
                type="button"
                className={`${styles.entityListItem} ${
                  user.professionalId === selectedUserId ? styles.entityListItemActive : ""
                }`}
                onClick={() => setSelectedUserId(user.professionalId)}
              >
                <strong>{user.fullName}</strong>
                <span>{user.businessName}</span>
                <span>{user.email}</span>
              </button>
            ))}
          </div>

          <div className={styles.entityDetail}>
            {selectedUser ? (
              <>
                <div className={styles.entityDetailHeader}>
                  <div>
                    <h3>{selectedUser.fullName}</h3>
                    <p>{selectedUser.businessName}</p>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => void impersonate(selectedUser.professionalId)}
                      disabled={isBusy}
                    >
                      Войти как пользователь
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => void deleteUser(selectedUser)}
                      disabled={isBusy}
                    >
                      Удалить пользователя
                    </button>
                  </div>
                </div>

                <div className={styles.metaGrid}>
                  <span>Email: {selectedUser.email}</span>
                  <span>Телефон: {selectedUser.phone || "—"}</span>
                  <span>Роль: {selectedUser.role}</span>
                  <span>Статус: {getScopeLabel(selectedUser.scope)}</span>
                  <span>Язык: {selectedUser.language}</span>
                  <span>Валюта: {selectedUser.currency}</span>
                  <span>Услуг: {selectedUser.servicesCount}</span>
                  <span>Фото: {selectedUser.photosCount}</span>
                </div>

                <div className={styles.balanceRow}>
                  <label className={styles.field}>
                    <span>Баланс записей</span>
                    <input
                      className={styles.input}
                      value={balanceDrafts[selectedUser.professionalId]?.bookingCreditsTotal ?? ""}
                      onChange={(event) =>
                        setBalanceDrafts((current) => ({
                          ...current,
                          [selectedUser.professionalId]: {
                            bookingCreditsTotal: event.target.value,
                            walletBalance:
                              current[selectedUser.professionalId]?.walletBalance ?? String(selectedUser.walletBalance)
                          }
                        }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Денежный баланс</span>
                    <input
                      className={styles.input}
                      value={balanceDrafts[selectedUser.professionalId]?.walletBalance ?? ""}
                      onChange={(event) =>
                        setBalanceDrafts((current) => ({
                          ...current,
                          [selectedUser.professionalId]: {
                            bookingCreditsTotal:
                              current[selectedUser.professionalId]?.bookingCreditsTotal ??
                              String(selectedUser.bookingCreditsTotal),
                            walletBalance: event.target.value
                          }
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => void saveBalances(selectedUser)}
                    disabled={isBusy}
                  >
                    Сохранить балансы
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>Найди пользователя слева, и здесь откроется его карточка.</div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Услуги пользователей</h2>
            <p>Здесь только пользовательские услуги. Сначала очередь на модерацию, ниже сгруппированные списки для уже одобренных и заблокированных.</p>
          </div>
          <input
            className={styles.searchInput}
            placeholder="Поиск по услуге, категории, бизнесу или автору"
            value={serviceQuery}
            onChange={(event) => setServiceQuery(event.target.value)}
          />
        </div>

        <div className={styles.metricsMini}>
          <article className={styles.metricCardMini}>
            <strong>{pendingServices.length}</strong>
            <span>Ждут модерации</span>
          </article>
          <article className={styles.metricCardMini}>
            <strong>{approvedServices.length}</strong>
            <span>Одобрены</span>
          </article>
          <article className={styles.metricCardMini}>
            <strong>{blockedServices.length}</strong>
            <span>Заблокированы</span>
          </article>
        </div>

        <div className={styles.entityDetailCompact}>
          <div className={styles.entityDetailHeader}>
            <div>
              <h3>Очередь модерации</h3>
              <p>По умолчанию здесь самые важные услуги: пользователь уже работает с ними внутри кабинета, но на сайт они выйдут только после утверждения.</p>
            </div>
          </div>
          <div className={styles.tableLike}>
            {pendingServices.length > 0 ? (
              pendingServices.map((service) => renderServiceRow(service))
            ) : (
              <div className={styles.emptyState}>Сейчас в очереди модерации нет услуг.</div>
            )}
          </div>
        </div>

        <div className={styles.accordionList}>
          {groupedServices.map((group) => (
            <details key={group.businessId} className={styles.accordion} open={serviceQuery.length > 0}>
              <summary className={styles.accordionSummary}>
                <div>
                  <strong>{group.businessName}</strong>
                  <span>
                    {group.items.filter((item) => item.moderationStatus === "pending" && !item.isBlocked).length} ждут ·{" "}
                    {group.items.filter((item) => item.moderationStatus === "approved" && !item.isBlocked).length} одобрены ·{" "}
                    {group.items.filter((item) => item.isBlocked).length} заблокированы
                  </span>
                </div>
              </summary>
              <div className={styles.tableLike}>
                {group.items.map((service) => renderServiceRow(service))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Фотографии компаний</h2>
            <p>Тоже сгруппированы по бизнесам. Можно быстро сворачивать и открывать только нужную компанию.</p>
          </div>
          <input
            className={styles.searchInput}
            placeholder="Поиск по бизнесу, подписи или автору"
            value={photoQuery}
            onChange={(event) => setPhotoQuery(event.target.value)}
          />
        </div>

        <div className={styles.accordionList}>
          {groupedPhotos.map((group) => (
            <details key={group.businessId} className={styles.accordion} open={photoQuery.length > 0}>
              <summary className={styles.accordionSummary}>
                <div>
                  <strong>{group.businessName}</strong>
                  <span>{group.items.length} фото</span>
                </div>
              </summary>
              <div className={styles.photoGrid}>
                {group.items.map((photo) => (
                  <article key={`${photo.businessId}:${photo.id}`} className={styles.photoCard}>
                    <button
                      type="button"
                      className={styles.photoButton}
                      onClick={() => void impersonate(photo.addedByProfessionalId)}
                    >
                      <img src={photo.url} alt={photo.caption || photo.businessName} className={styles.photoImage} />
                    </button>
                    <div className={styles.photoBody}>
                      <strong>{photo.caption || photo.businessName}</strong>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => void impersonate(photo.addedByProfessionalId)}
                      >
                        {photo.addedByName}
                      </button>
                      <div className={styles.rowMeta}>
                        {photo.isPrimary ? "Главное фото" : "Дополнительное"} ·{" "}
                        {photo.status === "blocked" ? "Заблокировано" : "Активно"}
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => void togglePhotoBlocked(photo, photo.status !== "blocked")}
                        disabled={isBusy}
                      >
                        {photo.status === "blocked" ? "Разблокировать" : "Блокировать"}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => void deletePhoto(photo)}
                        disabled={isBusy}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Корневой каталог услуг</h2>
            <p>
              Редактируется отдельно, чтобы менять базу предложений для всего сайта в одном месте. Для каждого
              элемента можно задать названия на RU/UK/EN и цену.
            </p>
          </div>
          <input
            className={styles.searchInput}
            placeholder="Поиск по категории, названию, группе или локализациям"
            value={catalogQuery}
            onChange={(event) => setCatalogQuery(event.target.value)}
          />
        </div>
        <div className={styles.catalogTools}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void seedCatalogDefaults(false)}
            disabled={isBusy}
          >
            Загрузить базовые услуги
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setCatalogDraft(defaultCatalogDraft)}
            disabled={isBusy}
          >
            Новая услуга
          </button>
        </div>
        <div className={styles.catalogComposer}>
          <label className={styles.field}>
            <span>Категория</span>
            <select
              className={styles.select}
              value={catalogDraft.category}
              onChange={(event) => setCatalogDraft((current) => ({ ...current, category: event.target.value }))}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Группа</span>
            <select
              className={styles.select}
              value={catalogDraft.groupKey}
              onChange={(event) =>
                setCatalogDraft((current) => ({
                  ...current,
                  groupKey:
                    event.target.value === "popularServices" ? "popularServices" : "topSuggestions"
                }))
              }
            >
              <option value="topSuggestions">Основные</option>
              <option value="popularServices">Популярные</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Название услуги</span>
            <input
              className={styles.input}
              value={catalogDraft.name}
              onChange={(event) => setCatalogDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span>Название RU</span>
            <input
              className={styles.input}
              value={catalogDraft.localizedNameRu}
              onChange={(event) =>
                setCatalogDraft((current) => ({ ...current, localizedNameRu: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span>Название UK</span>
            <input
              className={styles.input}
              value={catalogDraft.localizedNameUk}
              onChange={(event) =>
                setCatalogDraft((current) => ({ ...current, localizedNameUk: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span>Название EN</span>
            <input
              className={styles.input}
              value={catalogDraft.localizedNameEn}
              onChange={(event) =>
                setCatalogDraft((current) => ({ ...current, localizedNameEn: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span>Минуты</span>
            <input
              className={styles.input}
              value={catalogDraft.durationMinutes}
              onChange={(event) =>
                setCatalogDraft((current) => ({
                  ...current,
                  durationMinutes: Number(event.target.value) || 0
                }))
              }
            />
          </label>
          <label className={styles.field}>
            <span>Цена</span>
            <input
              className={styles.input}
              value={catalogDraft.price}
              onChange={(event) =>
                setCatalogDraft((current) => ({ ...current, price: Number(event.target.value) || 0 }))
              }
            />
          </label>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void saveCatalogItem(catalogDraft)}
            disabled={isBusy || !catalogDraft.name.trim()}
          >
            {catalogDraft.id ? "Сохранить элемент" : "Добавить в root-каталог"}
          </button>
        </div>
        <div className={styles.tableLike}>
          {filteredCatalog.length > 0 ? (
            filteredCatalog.map((item) => (
              <div key={item.id} className={styles.tableRow}>
                <div>
                  <strong>{item.name}</strong>
                  <div className={styles.rowMeta}>
                    {item.category} · {item.groupKey === "popularServices" ? "Популярные" : "Основные"}
                  </div>
                  {item.localizedName?.ru || item.localizedName?.uk || item.localizedName?.en ? (
                    <div className={styles.rowMeta}>
                      RU: {item.localizedName?.ru || "—"} · UK: {item.localizedName?.uk || "—"} · EN:{" "}
                      {item.localizedName?.en || "—"}
                    </div>
                  ) : null}
                </div>
                <div className={styles.rowMeta}>
                  {item.durationMinutes || 60} мин · {item.price || 0}
                </div>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setCatalogDraft({
                        id: item.id,
                        category: item.category,
                        groupKey: item.groupKey,
                        name: item.name,
                        localizedNameRu: item.localizedName?.ru || "",
                        localizedNameUk: item.localizedName?.uk || "",
                        localizedNameEn: item.localizedName?.en || "",
                        durationMinutes: item.durationMinutes || 60,
                        price: item.price || 0,
                        sortOrder: item.sortOrder
                      })
                    }
                  >
                    Редактировать RU/UK/EN и цену
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => void deleteCatalogItem(item.id)}
                    disabled={isBusy}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              {catalog.length === 0
                ? "Каталог пока пуст. Нажми «Загрузить базовые услуги», чтобы открыть полный список для редактирования."
                : "По текущему фильтру ничего не найдено."}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
