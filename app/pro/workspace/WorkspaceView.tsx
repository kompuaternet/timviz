"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProfileAvatar from "../../ProfileAvatar";
import styles from "../pro.module.css";
import LogoutButton from "./LogoutButton";
import ProSidebar from "../ProSidebar";
import type { WorkSchedule, WorkScheduleMode } from "../../../lib/work-schedule";
import { languageFromProfile } from "../i18n";
import { useProLanguage } from "../useProLanguage";

type WorkspaceSnapshot = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    phone: string;
    country: string;
    timezone: string;
    language: string;
    ownerMode: "owner" | "member";
  };
  business: {
    id: string;
    name: string;
    categories: string[];
    accountType: "solo" | "team";
    serviceMode: string;
    workScheduleMode: WorkScheduleMode;
    workSchedule: WorkSchedule;
    address: string;
    addressDetails: string;
    allowOnlineBooking?: boolean;
    photos?: Array<{
      id: string;
      url: string;
      isPrimary?: boolean;
      status?: "active" | "blocked";
    }>;
  };
  membership: {
    role: string;
    scope: "owner" | "member";
  };
  memberSchedule: {
    workScheduleMode: WorkScheduleMode;
    workSchedule: WorkSchedule;
  };
  services: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes?: number;
  }>;
  telegram?: {
    connected: boolean;
    chatId: string | null;
  };
};

function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasWorkingHoursConfigured(schedule: WorkSchedule | undefined) {
  if (!schedule) {
    return false;
  }

  return Object.values(schedule).some((day) => {
    if (!day?.enabled) {
      return false;
    }

    if (!day.startTime || !day.endTime) {
      return false;
    }

    return timeToMinutes(day.endTime) > timeToMinutes(day.startTime);
  });
}

const workspaceCopy = {
  ru: {
    loading: "Загружаем рабочее пространство...",
    dateLabel: "чт 9 апр.",
    settingsPill: "Настройки",
    ownerRole: "Владелец бизнеса",
    workingIn: (name: string) => `Работаю в составе ${name}`,
    ownerWorkspace: "Кабинет владельца",
    proWorkspace: "Кабинет мастера",
    premium: "Премиум",
    personal: "Персональный",
    ownerHeroText: "Управление мастерами, услугами, ролями и всеми записями бизнеса в одном рабочем пространстве.",
    memberHeroText: "Личный календарь мастера, свои записи, услуги и рабочая нагрузка внутри салона.",
    team: "Команда",
    solo: "Соло",
    fullAccess: "Полный доступ",
    limitedAccess: "Ограниченный доступ",
    accountSaved: "Аккаунт сохранен в базе",
    businessCreated: "Бизнес создан",
    salonConnected: "Подключение к салону завершено",
    setupMasters: "Настроить мастеров",
    checkSchedule: "Проверить свой график",
    servicesBase: "Услуги в базе",
    businessAddress: "Адрес бизнеса",
    links: "Переходы",
    openCatalog: "Открыть клиентский каталог",
    servicesCount: "услуг",
    checklistProgress: (done: number, total: number) => `${done} из ${total} выполнено`,
    profileReadyComplete: "Профиль полностью готов 🚀",
    stepServices: "Додайте послуги і встановіть ціни",
    stepSchedule: "Налаштуйте графік роботи",
    stepBooking: "Увімкніть онлайн-запис",
    stepPhoto: "Додайте фото бізнесу",
    stepPhotoHint: "Додайте фото — профіль виглядатиме професійніше і викликатиме більше довіри",
    stepAddress: "Додайте адресу",
    stepTelegram: "Підключіть Telegram",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Стрижка" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Окрашивание" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Маникюр" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Педикюр" }
      ]
    }
  },
  uk: {
    loading: "Завантажуємо робочий кабінет...",
    dateLabel: "чт 9 квіт.",
    settingsPill: "Налаштування",
    ownerRole: "Власник бізнесу",
    workingIn: (name: string) => `Працюю у складі ${name}`,
    ownerWorkspace: "Кабінет власника",
    proWorkspace: "Кабінет майстра",
    premium: "Преміум",
    personal: "Персональний",
    ownerHeroText: "Керування майстрами, послугами, ролями та всіма записами бізнесу в одному робочому просторі.",
    memberHeroText: "Особистий календар майстра, свої записи, послуги й завантаження всередині салону.",
    team: "Команда",
    solo: "Соло",
    fullAccess: "Повний доступ",
    limitedAccess: "Обмежений доступ",
    accountSaved: "Акаунт збережено в базі",
    businessCreated: "Бізнес створено",
    salonConnected: "Підключення до салону завершено",
    setupMasters: "Налаштувати майстрів",
    checkSchedule: "Перевірити свій графік",
    servicesBase: "Послуги в базі",
    businessAddress: "Адреса бізнесу",
    links: "Переходи",
    openCatalog: "Відкрити клієнтський каталог",
    servicesCount: "послуг",
    checklistProgress: (done: number, total: number) => `${done} з ${total} виконано`,
    profileReadyComplete: "Профіль повністю готовий 🚀",
    stepServices: "Додайте послуги і встановіть ціни",
    stepSchedule: "Налаштуйте графік роботи",
    stepBooking: "Увімкніть онлайн-запис",
    stepPhoto: "Додайте фото бізнесу",
    stepPhotoHint: "Додайте фото — профіль виглядатиме професійніше і викликатиме більше довіри",
    stepAddress: "Додайте адресу",
    stepTelegram: "Підключіть Telegram",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Стрижка" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Фарбування" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Манікюр" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Педикюр" }
      ]
    }
  },
  en: {
    loading: "Loading workspace...",
    dateLabel: "Thu Apr 9",
    settingsPill: "Settings",
    ownerRole: "Business owner",
    workingIn: (name: string) => `Working as part of ${name}`,
    ownerWorkspace: "Owner workspace",
    proWorkspace: "Pro workspace",
    premium: "Premium",
    personal: "Personal",
    ownerHeroText: "Manage specialists, services, roles and all business bookings in one workspace.",
    memberHeroText: "Personal specialist calendar, own bookings, services and workload inside the salon.",
    team: "Team",
    solo: "Solo",
    fullAccess: "Full access",
    limitedAccess: "Limited access",
    accountSaved: "Account saved in the database",
    businessCreated: "Business created",
    salonConnected: "Salon connection completed",
    setupMasters: "Set up specialists",
    checkSchedule: "Check your schedule",
    servicesBase: "Services in the database",
    businessAddress: "Business address",
    links: "Links",
    openCatalog: "Open client catalog",
    servicesCount: "services",
    checklistProgress: (done: number, total: number) => `${done} of ${total} completed`,
    profileReadyComplete: "Profile is fully ready 🚀",
    stepServices: "Add services and set prices",
    stepSchedule: "Configure working schedule",
    stepBooking: "Enable online booking",
    stepPhoto: "Add business photo",
    stepPhotoHint: "Add a photo to make your profile look more professional and build trust",
    stepAddress: "Add address",
    stepTelegram: "Connect Telegram",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Haircut" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Hair coloring" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Manicure" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Pedicure" }
      ]
    }
  }
} as const;

type WorkspaceViewProps = {
  professionalId: string;
};

export default function WorkspaceView({ professionalId }: WorkspaceViewProps) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const { t, language } = useProLanguage(languageFromProfile(snapshot?.professional.language));

  useEffect(() => {
    if (!professionalId) {
      return;
    }

    void fetch(`/api/pro/workspace/${professionalId}`)
      .then((response) => response.json())
      .then((data) => {
        setSnapshot(data);
      });
  }, [professionalId]);

  const isOwner = snapshot?.membership.scope === "owner";
  const copy = workspaceCopy[language];
  const bookings = isOwner ? copy.bookings.owner : copy.bookings.member;
  const scheduleHref = isOwner ? "/pro/staff/schedule" : "/pro/schedule";
  const hasAddress = Boolean(snapshot?.business.address?.trim() || snapshot?.business.addressDetails?.trim());
  const hasValidService =
    (snapshot?.services ?? []).length > 0 &&
    (snapshot?.services ?? []).some(
      (service) =>
        Number.isFinite(service.price) &&
        service.price > 0 &&
        Number.isFinite(service.durationMinutes ?? Number.NaN) &&
        (service.durationMinutes ?? 0) > 0
    );
  const scheduleReady = hasWorkingHoursConfigured(
    isOwner ? snapshot?.business.workSchedule : snapshot?.memberSchedule.workSchedule
  );
  const bookingReady = snapshot?.business.allowOnlineBooking === true;
  const photoReady = (snapshot?.business.photos ?? []).some(
    (photo) => photo.status !== "blocked" && photo.url.trim().length > 0
  );
  const telegramReady = Boolean(snapshot?.telegram?.chatId);

  const initials = useMemo(() => {
    if (!snapshot) {
      return "RZ";
    }

    return `${snapshot.professional.firstName?.[0] ?? ""}${snapshot.professional.lastName?.[0] ?? ""}`.toUpperCase() || "RZ";
  }, [snapshot]);

  if (!snapshot) {
    return (
      <main className={styles.workspaceShell}>
        <section className={styles.workspaceMain}>
          <div className={styles.workspaceTopBar}>
            <strong>{copy.loading}</strong>
          </div>
        </section>
      </main>
    );
  }

  const checklistItems = [
    {
      id: "services",
      title: copy.stepServices,
      completed: hasValidService
    },
    {
      id: "schedule",
      title: copy.stepSchedule,
      completed: scheduleReady
    },
    {
      id: "booking",
      title: copy.stepBooking,
      completed: bookingReady
    },
    {
      id: "photo",
      title: copy.stepPhoto,
      hint: copy.stepPhotoHint,
      completed: photoReady
    },
    ...(!hasAddress
      ? [
          {
            id: "address",
            title: copy.stepAddress,
            completed: false
          }
        ]
      : []),
    {
      id: "telegram",
      title: copy.stepTelegram,
      completed: telegramReady
    }
  ];
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const checklistTotal = checklistItems.length;
  const checklistActiveId =
    checklistItems.find((item) => !item.completed)?.id ?? null;
  const checklistComplete = completedChecklistCount === checklistTotal;

  return (
    <main className={styles.workspaceShell}>
      <ProSidebar
        active="workspace"
        professionalId={professionalId}
        canManageStaff={snapshot.membership.scope === "owner"}
      />

      <section className={styles.workspaceMain}>
        <div className={styles.workspaceTopBar}>
          <div className={styles.workspaceControls}>
            <div className={styles.pillControl}>{t.schedule.today}</div>
            <div className={styles.pillControl}>{copy.dateLabel}</div>
            <Link href={scheduleHref} className={styles.pillControl}>
              {t.schedule.mySchedule}
            </Link>
            <div className={styles.pillControl}>{copy.settingsPill}</div>
          </div>

          <div className={styles.workspaceProfile}>
            <ProfileAvatar
              avatarUrl={snapshot.professional.avatarUrl}
              initials={initials}
              label={`${snapshot.professional.firstName} ${snapshot.professional.lastName}`.trim() || snapshot.business.name}
              className={styles.avatar}
              imageClassName={styles.avatarImage}
              fallbackClassName={styles.avatarFallback}
            />
            <div>
              <strong>{snapshot.business.name}</strong>
              <div>{isOwner ? copy.ownerRole : snapshot.membership.role}</div>
            </div>
            <LogoutButton />
          </div>
        </div>

        <div className={styles.workspaceHeader}>
          <strong>{Array.isArray(snapshot.business.categories) ? snapshot.business.categories.join(" · ") : ""}</strong>
          <div>
            {isOwner
              ? `${snapshot.services.length} ${copy.servicesCount} · ${snapshot.business.serviceMode}`
              : copy.workingIn(snapshot.business.name)}
          </div>
        </div>

        <div className={styles.workspaceGrid}>
          <div className={styles.hourColumn}>
            {Array.from({ length: 9 }, (_, index) => {
              const hour = index + 9;
              return (
                <div
                  key={hour}
                  className={styles.hourLabel}
                  style={{ top: `${index * 76 + 56}px` }}
                >
                  {`${hour}:00`}
                </div>
              );
            })}
          </div>

          <div className={styles.calendarBody}>
            <div className={styles.nowLine} style={{ top: "320px" }}>
              <span className={styles.nowBadge}>13:31</span>
            </div>

            {bookings.map((booking) => (
              <article
                key={booking.time}
                className={styles.bookingBlock}
                style={{ top: `${booking.start}px`, height: `${booking.height}px` }}
              >
                <span className={styles.bookingTime}>{booking.time}</span>
                <strong className={styles.bookingTitle}>{booking.client}</strong>
                <span>{booking.service}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside className={styles.workspaceAside}>
        <div className={styles.asideHero}>
          <div className={styles.asideHeroTop}>
            <span className={styles.asideHeroLabel}>
              {isOwner ? copy.ownerWorkspace : copy.proWorkspace}
            </span>
            <span className={styles.asideHeroPill}>
              {isOwner ? copy.premium : copy.personal}
            </span>
          </div>
          <h3 className={styles.asideHeroTitle}>
            {isOwner ? snapshot.business.name : snapshot.professional.firstName}
          </h3>
          <p className={styles.asideHeroText}>
            {isOwner
              ? copy.ownerHeroText
              : copy.memberHeroText}
          </p>
          <div className={styles.asideHeroMeta}>
            <span>{snapshot.business.accountType === "team" ? copy.team : copy.solo}</span>
            <span>{snapshot.services.length} {copy.servicesCount}</span>
            <span>{isOwner ? copy.fullAccess : copy.limitedAccess}</span>
          </div>
        </div>

        <div className={styles.asideCard}>
          <div className={styles.checklist}>
            <div className={styles.checklistProgress}>
              {copy.checklistProgress(completedChecklistCount, checklistTotal)}
            </div>
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`${styles.checkItem} ${checklistActiveId === item.id ? styles.checkItemActive : ""}`}
              >
                <div className={styles.checkItemText}>
                  <span>{item.title}</span>
                  {item.hint ? (
                    <small className={styles.checkHint}>{item.hint}</small>
                  ) : null}
                </div>
                {item.completed ? (
                  <span className={styles.checkDone}>✓</span>
                ) : checklistActiveId === item.id ? (
                  <span className={styles.checkPending}>→</span>
                ) : (
                  <span className={styles.checkTodo}>•</span>
                )}
              </div>
            ))}
            {checklistComplete ? (
              <div className={styles.checklistComplete}>
                {copy.profileReadyComplete}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.asideCard}>
          <div className={styles.miniList}>
            <div>
              <strong>{copy.servicesBase}</strong>
              <div className={styles.generatedList}>
                {snapshot.services.map((service) => (
                  <span key={service.id} className={styles.generatedChip}>
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
            {snapshot.business.addressDetails ? (
              <div>
                <strong>{copy.businessAddress}</strong>
                <span className={styles.addressPreview}>{snapshot.business.addressDetails}</span>
              </div>
            ) : null}
            <div>
              <strong>{copy.links}</strong>
              <Link href="/catalog" className={styles.mutedLink}>
                {copy.openCatalog}
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
