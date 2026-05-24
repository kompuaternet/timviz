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
    openCatalog: "Открыть поиск профилей",
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
    openCatalog: "Відкрити пошук профілів",
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
  },
  fr: {
    loading: "Chargement de l’espace de travail...",
    dateLabel: "jeu. 9 avr.",
    settingsPill: "Réglages",
    ownerRole: "Propriétaire",
    workingIn: (name: string) => `Travaille dans ${name}`,
    ownerWorkspace: "Espace propriétaire",
    proWorkspace: "Espace professionnel",
    premium: "Premium",
    personal: "Personnel",
    ownerHeroText: "Gérez spécialistes, services, rôles et toutes les réservations dans un seul espace.",
    memberHeroText: "Calendrier personnel du spécialiste, réservations, services et charge de travail dans le salon.",
    team: "Équipe",
    solo: "Solo",
    fullAccess: "Accès complet",
    limitedAccess: "Accès limité",
    accountSaved: "Compte enregistré",
    businessCreated: "Entreprise créée",
    salonConnected: "Connexion au salon terminée",
    setupMasters: "Configurer les spécialistes",
    checkSchedule: "Vérifier votre horaire",
    servicesBase: "Services dans la base",
    businessAddress: "Adresse de l’entreprise",
    links: "Liens",
    openCatalog: "Ouvrir le catalogue client",
    servicesCount: "services",
    checklistProgress: (done: number, total: number) => `${done} sur ${total} terminé`,
    profileReadyComplete: "Profil entièrement prêt 🚀",
    stepServices: "Ajouter des services et fixer les prix",
    stepSchedule: "Configurer l’horaire de travail",
    stepBooking: "Activer la réservation en ligne",
    stepPhoto: "Ajouter une photo de l’entreprise",
    stepPhotoHint: "Ajoutez une photo pour rendre le profil plus professionnel et inspirer confiance",
    stepAddress: "Ajouter l’adresse",
    stepTelegram: "Connecter Telegram",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Coupe" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Coloration" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Manucure" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Pédicure" }
      ]
    }
  },
  pl: {
    loading: "Ładowanie przestrzeni roboczej...",
    dateLabel: "czw. 9 kwi",
    settingsPill: "Ustawienia",
    ownerRole: "Właściciel firmy",
    workingIn: (name: string) => `Pracuję w ${name}`,
    ownerWorkspace: "Panel właściciela",
    proWorkspace: "Panel specjalisty",
    premium: "Premium",
    personal: "Osobisty",
    ownerHeroText: "Zarządzaj specjalistami, usługami, rolami i wszystkimi rezerwacjami w jednym miejscu.",
    memberHeroText: "Osobisty kalendarz specjalisty, własne rezerwacje, usługi i obciążenie w salonie.",
    team: "Zespół",
    solo: "Solo",
    fullAccess: "Pełny dostęp",
    limitedAccess: "Ograniczony dostęp",
    accountSaved: "Konto zapisane w bazie",
    businessCreated: "Firma utworzona",
    salonConnected: "Połączenie z salonem zakończone",
    setupMasters: "Skonfiguruj specjalistów",
    checkSchedule: "Sprawdź grafik",
    servicesBase: "Usługi w bazie",
    businessAddress: "Adres firmy",
    links: "Linki",
    openCatalog: "Otwórz katalog klientów",
    servicesCount: "usług",
    checklistProgress: (done: number, total: number) => `${done} z ${total} ukończono`,
    profileReadyComplete: "Profil jest gotowy 🚀",
    stepServices: "Dodaj usługi i ceny",
    stepSchedule: "Skonfiguruj grafik pracy",
    stepBooking: "Włącz rezerwacje online",
    stepPhoto: "Dodaj zdjęcie firmy",
    stepPhotoHint: "Dodaj zdjęcie, aby profil wyglądał profesjonalnie i budował zaufanie",
    stepAddress: "Dodaj adres",
    stepTelegram: "Połącz Telegram",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Strzyżenie" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Koloryzacja" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Manicure" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Pedicure" }
      ]
    }
  },
  cs: {
    loading: "Načítání pracovního prostoru...",
    dateLabel: "čt 9. dub.",
    settingsPill: "Nastavení",
    ownerRole: "Majitel firmy",
    workingIn: (name: string) => `Pracuji v ${name}`,
    ownerWorkspace: "Prostor majitele",
    proWorkspace: "Prostor specialisty",
    premium: "Premium",
    personal: "Osobní",
    ownerHeroText: "Spravujte specialisty, služby, role a všechny rezervace firmy v jednom prostoru.",
    memberHeroText: "Osobní kalendář specialisty, vlastní rezervace, služby a vytížení uvnitř salonu.",
    team: "Tým",
    solo: "Solo",
    fullAccess: "Plný přístup",
    limitedAccess: "Omezený přístup",
    accountSaved: "Účet uložen v databázi",
    businessCreated: "Firma vytvořena",
    salonConnected: "Připojení k salonu dokončeno",
    setupMasters: "Nastavit specialisty",
    checkSchedule: "Zkontrolovat rozvrh",
    servicesBase: "Služby v databázi",
    businessAddress: "Adresa firmy",
    links: "Odkazy",
    openCatalog: "Otevřít klientský katalog",
    servicesCount: "služeb",
    checklistProgress: (done: number, total: number) => `${done} z ${total} hotovo`,
    profileReadyComplete: "Profil je plně připraven 🚀",
    stepServices: "Přidat služby a ceny",
    stepSchedule: "Nastavit pracovní rozvrh",
    stepBooking: "Zapnout online rezervace",
    stepPhoto: "Přidat fotku firmy",
    stepPhotoHint: "Přidejte fotku, aby profil vypadal profesionálněji a působil důvěryhodně",
    stepAddress: "Přidat adresu",
    stepTelegram: "Připojit Telegram",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Střih" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Barvení vlasů" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Manikúra" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Pedikúra" }
      ]
    }
  },
  es: {
    loading: "Cargando espacio de trabajo...",
    dateLabel: "jue. 9 abr.",
    settingsPill: "Ajustes",
    ownerRole: "Propietario",
    workingIn: (name: string) => `Trabajando en ${name}`,
    ownerWorkspace: "Panel del propietario",
    proWorkspace: "Panel profesional",
    premium: "Premium",
    personal: "Personal",
    ownerHeroText: "Gestiona especialistas, servicios, roles y todas las reservas del negocio en un solo espacio.",
    memberHeroText: "Calendario personal del especialista, reservas, servicios y carga de trabajo dentro del salón.",
    team: "Equipo",
    solo: "Solo",
    fullAccess: "Acceso completo",
    limitedAccess: "Acceso limitado",
    accountSaved: "Cuenta guardada en la base",
    businessCreated: "Empresa creada",
    salonConnected: "Conexión con el salón completada",
    setupMasters: "Configurar especialistas",
    checkSchedule: "Comprobar horario",
    servicesBase: "Servicios en la base",
    businessAddress: "Dirección del negocio",
    links: "Enlaces",
    openCatalog: "Abrir catálogo de clientes",
    servicesCount: "servicios",
    checklistProgress: (done: number, total: number) => `${done} de ${total} completado`,
    profileReadyComplete: "Perfil completamente listo 🚀",
    stepServices: "Añadir servicios y precios",
    stepSchedule: "Configurar horario de trabajo",
    stepBooking: "Activar reserva online",
    stepPhoto: "Añadir foto del negocio",
    stepPhotoHint: "Añade una foto para que el perfil se vea más profesional y genere confianza",
    stepAddress: "Añadir dirección",
    stepTelegram: "Conectar Telegram",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Corte" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Coloración" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Manicura" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Pedicura" }
      ]
    }
  },
  de: {
    loading: "Arbeitsbereich wird geladen...",
    dateLabel: "Do. 9. Apr.",
    settingsPill: "Einstellungen",
    ownerRole: "Inhaber",
    workingIn: (name: string) => `Arbeitet bei ${name}`,
    ownerWorkspace: "Inhaberbereich",
    proWorkspace: "Profi-Arbeitsbereich",
    premium: "Premium",
    personal: "Persönlich",
    ownerHeroText: "Verwalte Spezialisten, Leistungen, Rollen und alle Buchungen des Unternehmens in einem Arbeitsbereich.",
    memberHeroText: "Persönlicher Kalender des Spezialisten, eigene Buchungen, Leistungen und Auslastung im Salon.",
    team: "Team",
    solo: "Solo",
    fullAccess: "Voller Zugriff",
    limitedAccess: "Eingeschränkter Zugriff",
    accountSaved: "Konto in der Datenbank gespeichert",
    businessCreated: "Unternehmen erstellt",
    salonConnected: "Salonverbindung abgeschlossen",
    setupMasters: "Spezialisten einrichten",
    checkSchedule: "Zeitplan prüfen",
    servicesBase: "Leistungen in der Datenbank",
    businessAddress: "Firmenadresse",
    links: "Links",
    openCatalog: "Kundenkatalog öffnen",
    servicesCount: "Leistungen",
    checklistProgress: (done: number, total: number) => `${done} von ${total} erledigt`,
    profileReadyComplete: "Profil ist vollständig bereit 🚀",
    stepServices: "Leistungen und Preise hinzufügen",
    stepSchedule: "Arbeitszeiten einrichten",
    stepBooking: "Online-Buchung aktivieren",
    stepPhoto: "Firmenfoto hinzufügen",
    stepPhotoHint: "Füge ein Foto hinzu, damit das Profil professioneller wirkt und Vertrauen schafft",
    stepAddress: "Adresse hinzufügen",
    stepTelegram: "Telegram verbinden",
    bookings: {
      owner: [
        { start: 165, height: 56, time: "11:00 - 11:45", client: "John Doe", service: "Haarschnitt" },
        { start: 318, height: 92, time: "13:00 - 14:15", client: "Jane Doe", service: "Haarfarbe" }
      ],
      member: [
        { start: 170, height: 54, time: "11:15 - 12:00", client: "Anna K.", service: "Maniküre" },
        { start: 330, height: 74, time: "13:15 - 14:15", client: "Ira M.", service: "Pediküre" }
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
  const copy = (workspaceCopy as unknown as Record<string, typeof workspaceCopy.en>)[language] ?? workspaceCopy.en;
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
