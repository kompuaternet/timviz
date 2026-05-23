"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import ProfileAvatar from "../../ProfileAvatar";
import type { PublicCustomerSession } from "../../../lib/public-customer-auth";
import type { BusinessRecord, ServiceRecord } from "../../../lib/pro-data";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneRule,
  inferPhoneCountryFromAddress,
  inferPhoneCountryFromLocales,
  isPhoneValid,
  onlyPhoneDigits,
  phoneCountries
} from "../../../lib/phone-format";
import { getPublicBookingSlots } from "../../../lib/public-booking";
import { localizeCategoryName, localizeServiceName } from "../../../lib/service-templates";
import { getLocalizedPath, localeBySiteLanguage, type SiteLanguage , withEnglishFallback } from "../../../lib/site-language";
import {
  addMinutesToTime,
  getDayScheduleForMode,
  normalizeCustomSchedule,
  normalizeWorkSchedule,
  workDays,
  type CustomSchedule,
  type WorkSchedule,
  type WorkScheduleMode
} from "../../../lib/work-schedule";
import BrandLogo from "../../BrandLogo";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "../../PublicHeaderAuthMenu";
import { createBusinessBookingAction } from "./actions";

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  scope: "owner" | "member";
  workScheduleMode: WorkScheduleMode;
  workSchedule: WorkSchedule;
  customSchedule: CustomSchedule;
};

type BookingBusySlot = {
  appointmentDate: string;
  appointmentTime: string;
  endTime: string;
  serviceName: string;
  professionalId?: string;
};

type BusinessViewProps = {
  business: BusinessRecord;
  services: ServiceRecord[];
  bookings: BookingBusySlot[];
  image: string;
  photos: string[];
  team: TeamMember[];
  initialLanguage: SiteLanguage;
  returnPath: string;
};

type CustomerSessionState = {
  loading: boolean;
  authenticated: boolean;
  customer: PublicCustomerSession | null;
};

type TelegramRuntime = {
  openLink?: (url: string, options?: { try_instant_view?: boolean; try_browser?: string }) => void;
  initData?: string;
};

type BookingStep = "services" | "specialists" | "time" | "confirm";

type StepKey = "photos" | "services" | "team" | "details";

type BusinessCopy = {
  breadcrumbHome: string;
  breadcrumbCatalog: string;
  openUntil: string;
  route: string;
  services: string;
  team: string;
  details: string;
  bookNow: string;
  onlineBookingOff: string;
  onlineBookingOffText: string;
  bookingFlowTitle: string;
  serviceStep: string;
  specialistStep: string;
  timeStep: string;
  confirmStep: string;
  noPreference: string;
  noPreferenceText: string;
  select: string;
  selected: string;
  chooseSpecialist: string;
  chooseTime: string;
  continue: string;
  goToConfirm: string;
  total: string;
  close: string;
  back: string;
  duration: string;
  minuteShort: string;
  date: string;
  time: string;
  specialist: string;
  selectedServices: string;
  addAnother: string;
  signInGoogle: string;
  signInHint: string;
  phoneTitle: string;
  phonePlaceholder: string;
  confirmBooking: string;
  confirmBookingSubmitting: string;
  pendingHint: string;
  workingHours: string;
  noTimeForDay: string;
  noFreeDays: string;
  freeTime: string;
  freeDay: string;
  closedDay: string;
  fullyBooked: string;
  dayAvailable: string;
  summary: string;
  chooseService: string;
  fromPrice: string;
  reviews: string;
  verifiedRequest: string;
  companyInfo: string;
  address: string;
  website: string;
  signInAs: string;
  phoneError: string;
  photosTitle: string;
  mobileSubtitle: string;
  trustLine: string;
  morning: string;
  afternoon: string;
  evening: string;
  comment: string;
  commentPlaceholder: string;
  bookCta: string;
};

const businessCopy: Record<SiteLanguage, BusinessCopy> = withEnglishFallback<BusinessCopy>({
  ru: {
    breadcrumbHome: "Главная",
    breadcrumbCatalog: "Каталог",
    openUntil: "Открыто до",
    route: "Проложить маршрут",
    services: "Услуги",
    team: "Специалисты",
    details: "Общие сведения",
    bookNow: "Забронировать",
    onlineBookingOff: "Онлайн-запись выключена",
    onlineBookingOffText:
      "Владелец компании пока не принимает онлайн-записи с сайта. Страница компании остаётся доступной для просмотра.",
    bookingFlowTitle: "Бронирование",
    serviceStep: "Услуги",
    specialistStep: "Специалист",
    timeStep: "Время",
    confirmStep: "Подтверждение",
    noPreference: "Нет предпочтений",
    noPreferenceText: "Подберём ближайшее свободное время у команды",
    select: "Выбрать",
    selected: "Выбрано",
    chooseSpecialist: "Выберите специалиста",
    chooseTime: "Выберите время",
    continue: "Продолжить",
    goToConfirm: "Перейти к подтверждению",
    total: "Всего к оплате",
    close: "Закрыть",
    back: "Назад",
    duration: "Длительность",
    minuteShort: "мин",
    date: "Дата",
    time: "Время",
    specialist: "Специалист",
    selectedServices: "Услуги визита",
    addAnother: "Добавить ещё услугу",
    signInGoogle: "Продолжить через Google",
    signInHint: "Сначала войдите через Google, затем добавьте телефон и подтвердите запись.",
    phoneTitle: "Телефон для подтверждения",
    phonePlaceholder: "Ваш номер",
    confirmBooking: "Записаться",
    confirmBookingSubmitting: "Отправляем…",
    pendingHint: "После отправки запись появится в календаре владельца и будет ждать подтверждения.",
    workingHours: "График работы",
    noTimeForDay: "На этот день свободного времени нет.",
    noFreeDays: "На ближайшие дни нет свободных окон.",
    freeTime: "Свободное время",
    freeDay: "Есть время",
    closedDay: "Выходной",
    fullyBooked: "Занято",
    dayAvailable: "Рабочий день",
    summary: "Ваш визит",
    chooseService: "Выберите хотя бы одну услугу",
    fromPrice: "от",
    reviews: "Онлайн-запись",
    verifiedRequest: "Заявка отправится владельцу на подтверждение",
    companyInfo: "Информация о компании",
    address: "Адрес",
    website: "Сайт",
    signInAs: "Вы вошли как",
    phoneError: "Проверьте номер телефона.",
    photosTitle: "Фотографии",
    mobileSubtitle: "Выберите услугу и удобное свободное время",
    trustLine: "Без звонков и переписок — вы выбираете только свободное время",
    morning: "Утро",
    afternoon: "День",
    evening: "Вечер",
    comment: "Комментарий",
    commentPlaceholder: "Например: удобнее писать в Telegram",
    bookCta: "Записаться"
  },
  uk: {
    breadcrumbHome: "Головна",
    breadcrumbCatalog: "Каталог",
    openUntil: "Відкрито до",
    route: "Прокласти маршрут",
    services: "Послуги",
    team: "Спеціалісти",
    details: "Загальна інформація",
    bookNow: "Забронювати",
    onlineBookingOff: "Онлайн-запис вимкнено",
    onlineBookingOffText:
      "Власник компанії поки що не приймає онлайн-записи із сайту. Сторінка компанії лишається доступною для перегляду.",
    bookingFlowTitle: "Бронювання",
    serviceStep: "Послуги",
    specialistStep: "Спеціаліст",
    timeStep: "Час",
    confirmStep: "Підтвердження",
    noPreference: "Без побажань",
    noPreferenceText: "Підберемо найближчий вільний час у команди",
    select: "Обрати",
    selected: "Обрано",
    chooseSpecialist: "Оберіть спеціаліста",
    chooseTime: "Оберіть час",
    continue: "Продовжити",
    goToConfirm: "Перейти до підтвердження",
    total: "Усього до оплати",
    close: "Закрити",
    back: "Назад",
    duration: "Тривалість",
    minuteShort: "хв",
    date: "Дата",
    time: "Час",
    specialist: "Спеціаліст",
    selectedServices: "Послуги візиту",
    addAnother: "Додати ще послугу",
    signInGoogle: "Продовжити через Google",
    signInHint: "Спершу увійдіть через Google, потім додайте телефон і підтвердьте запис.",
    phoneTitle: "Телефон для підтвердження",
    phonePlaceholder: "Ваш номер",
    confirmBooking: "Записатися",
    confirmBookingSubmitting: "Надсилаємо…",
    pendingHint: "Після відправлення запис з’явиться в календарі власника й чекатиме підтвердження.",
    workingHours: "Графік роботи",
    noTimeForDay: "На цей день вільного часу немає.",
    noFreeDays: "На найближчі дні немає вільних вікон.",
    freeTime: "Вільний час",
    freeDay: "Є час",
    closedDay: "Вихідний",
    fullyBooked: "Зайнято",
    dayAvailable: "Робочий день",
    summary: "Ваш візит",
    chooseService: "Оберіть хоча б одну послугу",
    fromPrice: "від",
    reviews: "Онлайн-запис",
    verifiedRequest: "Заявка піде власнику на підтвердження",
    companyInfo: "Інформація про компанію",
    address: "Адреса",
    website: "Сайт",
    signInAs: "Ви увійшли як",
    phoneError: "Перевірте номер телефону.",
    photosTitle: "Фотографії",
    mobileSubtitle: "Оберіть послугу та зручний вільний час",
    trustLine: "Без дзвінків і переписок — ви обираєте тільки вільний час",
    morning: "Ранок",
    afternoon: "День",
    evening: "Вечір",
    comment: "Коментар",
    commentPlaceholder: "Наприклад: зручніше писати в Telegram",
    bookCta: "Записатися"
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbCatalog: "Catalog",
    openUntil: "Open until",
    route: "Get directions",
    services: "Services",
    team: "Specialists",
    details: "About",
    bookNow: "Book now",
    onlineBookingOff: "Online booking is turned off",
    onlineBookingOffText:
      "The owner is not accepting public bookings from the site yet. The company page is still available for viewing.",
    bookingFlowTitle: "Booking",
    serviceStep: "Services",
    specialistStep: "Specialist",
    timeStep: "Time",
    confirmStep: "Confirm",
    noPreference: "No preference",
    noPreferenceText: "We’ll find the earliest available team slot",
    select: "Select",
    selected: "Selected",
    chooseSpecialist: "Choose a specialist",
    chooseTime: "Choose a time",
    continue: "Continue",
    goToConfirm: "Go to confirmation",
    total: "Total",
    close: "Close",
    back: "Back",
    duration: "Duration",
    minuteShort: "min",
    date: "Date",
    time: "Time",
    specialist: "Specialist",
    selectedServices: "Visit services",
    addAnother: "Add another service",
    signInGoogle: "Continue with Google",
    signInHint: "Sign in with Google first, then add your phone number and confirm the booking.",
    phoneTitle: "Phone for confirmation",
    phonePlaceholder: "Your phone number",
    confirmBooking: "Book now",
    confirmBookingSubmitting: "Submitting…",
    pendingHint: "After sending, the booking request appears in the owner calendar and waits for confirmation.",
    workingHours: "Working hours",
    noTimeForDay: "No free time on this day.",
    noFreeDays: "There are no free slots in the coming days.",
    freeTime: "Available time",
    freeDay: "Free",
    closedDay: "Closed",
    fullyBooked: "Full",
    dayAvailable: "Working day",
    summary: "Your visit",
    chooseService: "Choose at least one service",
    fromPrice: "from",
    reviews: "Online booking",
    verifiedRequest: "The request will be sent to the owner for confirmation",
    companyInfo: "Company details",
    address: "Address",
    website: "Website",
    signInAs: "Signed in as",
    phoneError: "Check the phone number.",
    photosTitle: "Photos",
    mobileSubtitle: "Choose a service and a convenient free time",
    trustLine: "No calls or messages — you only choose available time",
    morning: "Morning",
    afternoon: "Day",
    evening: "Evening",
    comment: "Comment",
    commentPlaceholder: "For example: Telegram is easier",
    bookCta: "Book"
  }
});

Object.assign(businessCopy, {
  fr: {
    ...businessCopy.en,
    breadcrumbHome: "Accueil",
    breadcrumbCatalog: "Catalogue",
    openUntil: "Ouvert jusqu’à",
    route: "Itinéraire",
    services: "Services",
    team: "Spécialistes",
    details: "À propos",
    bookNow: "Réserver",
    bookingFlowTitle: "Réservation",
    serviceStep: "Services",
    specialistStep: "Spécialiste",
    timeStep: "Heure",
    confirmStep: "Confirmation",
    noPreference: "Sans préférence",
    noPreferenceText: "Nous trouverons le premier créneau disponible dans l’équipe",
    select: "Choisir",
    selected: "Sélectionné",
    chooseSpecialist: "Choisissez un spécialiste",
    chooseTime: "Choisissez une heure",
    continue: "Continuer",
    goToConfirm: "Passer à la confirmation",
    total: "Total",
    close: "Fermer",
    back: "Retour",
    duration: "Durée",
    minuteShort: "min",
    date: "Date",
    time: "Heure",
    specialist: "Spécialiste",
    selectedServices: "Services du rendez-vous",
    addAnother: "Ajouter un autre service",
    signInGoogle: "Continuer avec Google",
    signInHint: "Connectez-vous avec Google, ajoutez votre téléphone puis confirmez la réservation.",
    phoneTitle: "Téléphone de confirmation",
    phonePlaceholder: "Votre numéro",
    confirmBooking: "Réserver",
    confirmBookingSubmitting: "Envoi…",
    pendingHint: "Après l’envoi, la demande apparaîtra dans le calendrier du propriétaire et attendra confirmation.",
    workingHours: "Horaires",
    noTimeForDay: "Aucun créneau disponible ce jour-là.",
    noFreeDays: "Aucun créneau libre dans les prochains jours.",
    freeTime: "Créneaux disponibles",
    freeDay: "Disponible",
    closedDay: "Fermé",
    fullyBooked: "Complet",
    dayAvailable: "Jour ouvré",
    summary: "Votre visite",
    chooseService: "Choisissez au moins un service",
    fromPrice: "à partir de",
    reviews: "Réservation en ligne",
    verifiedRequest: "La demande sera envoyée au propriétaire pour confirmation",
    companyInfo: "Informations sur l’entreprise",
    address: "Adresse",
    website: "Site web",
    signInAs: "Connecté en tant que",
    phoneError: "Vérifiez le numéro de téléphone.",
    photosTitle: "Photos",
    mobileSubtitle: "Choisissez un service et un créneau disponible",
    trustLine: "Sans appels ni messages — vous choisissez seulement un créneau libre",
    morning: "Matin",
    afternoon: "Après-midi",
    evening: "Soir",
    comment: "Commentaire",
    commentPlaceholder: "Par exemple : Telegram est plus pratique",
    bookCta: "Réserver"
  },
  pl: {
    ...businessCopy.en,
    breadcrumbHome: "Strona główna",
    breadcrumbCatalog: "Katalog",
    openUntil: "Otwarte do",
    route: "Wyznacz trasę",
    services: "Usługi",
    team: "Specjaliści",
    details: "O firmie",
    bookNow: "Zarezerwuj",
    bookingFlowTitle: "Rezerwacja",
    serviceStep: "Usługi",
    specialistStep: "Specjalista",
    timeStep: "Godzina",
    confirmStep: "Potwierdzenie",
    noPreference: "Bez preferencji",
    noPreferenceText: "Znajdziemy najbliższy wolny termin u zespołu",
    select: "Wybierz",
    selected: "Wybrano",
    chooseSpecialist: "Wybierz specjalistę",
    chooseTime: "Wybierz godzinę",
    continue: "Kontynuuj",
    goToConfirm: "Przejdź do potwierdzenia",
    total: "Razem",
    close: "Zamknij",
    back: "Wstecz",
    duration: "Czas trwania",
    minuteShort: "min",
    date: "Data",
    time: "Godzina",
    specialist: "Specjalista",
    selectedServices: "Usługi wizyty",
    addAnother: "Dodaj kolejną usługę",
    signInGoogle: "Kontynuuj z Google",
    signInHint: "Najpierw zaloguj się przez Google, potem dodaj telefon i potwierdź rezerwację.",
    phoneTitle: "Telefon do potwierdzenia",
    phonePlaceholder: "Twój numer",
    confirmBooking: "Zarezerwuj",
    confirmBookingSubmitting: "Wysyłanie…",
    pendingHint: "Po wysłaniu prośba pojawi się w kalendarzu właściciela i będzie czekać na potwierdzenie.",
    workingHours: "Godziny pracy",
    noTimeForDay: "Tego dnia nie ma wolnych terminów.",
    noFreeDays: "W najbliższych dniach nie ma wolnych terminów.",
    freeTime: "Dostępne terminy",
    freeDay: "Dostępne",
    closedDay: "Zamknięte",
    fullyBooked: "Zajęte",
    dayAvailable: "Dzień roboczy",
    summary: "Twoja wizyta",
    chooseService: "Wybierz co najmniej jedną usługę",
    fromPrice: "od",
    reviews: "Rezerwacja online",
    verifiedRequest: "Prośba zostanie wysłana do właściciela do potwierdzenia",
    companyInfo: "Informacje o firmie",
    address: "Adres",
    website: "Strona internetowa",
    signInAs: "Zalogowano jako",
    phoneError: "Sprawdź numer telefonu.",
    photosTitle: "Zdjęcia",
    mobileSubtitle: "Wybierz usługę i wygodny wolny termin",
    trustLine: "Bez telefonów i wiadomości — wybierasz tylko dostępny czas",
    morning: "Rano",
    afternoon: "Dzień",
    evening: "Wieczór",
    comment: "Komentarz",
    commentPlaceholder: "Na przykład: wygodniej pisać na Telegramie",
    bookCta: "Rezerwuj"
  },
  cs: {
    ...businessCopy.en,
    breadcrumbHome: "Domů",
    breadcrumbCatalog: "Katalog",
    openUntil: "Otevřeno do",
    route: "Navigovat",
    services: "Služby",
    team: "Specialisté",
    details: "O firmě",
    bookNow: "Rezervovat",
    bookingFlowTitle: "Rezervace",
    serviceStep: "Služby",
    specialistStep: "Specialista",
    timeStep: "Čas",
    confirmStep: "Potvrzení",
    noPreference: "Bez preference",
    noPreferenceText: "Najdeme nejbližší volný čas u týmu",
    select: "Vybrat",
    selected: "Vybráno",
    chooseSpecialist: "Vyberte specialistu",
    chooseTime: "Vyberte čas",
    continue: "Pokračovat",
    goToConfirm: "Přejít k potvrzení",
    total: "Celkem",
    close: "Zavřít",
    back: "Zpět",
    duration: "Délka",
    minuteShort: "min",
    date: "Datum",
    time: "Čas",
    specialist: "Specialista",
    selectedServices: "Služby návštěvy",
    addAnother: "Přidat další službu",
    signInGoogle: "Pokračovat přes Google",
    signInHint: "Nejprve se přihlaste přes Google, potom přidejte telefon a potvrďte rezervaci.",
    phoneTitle: "Telefon pro potvrzení",
    phonePlaceholder: "Vaše číslo",
    confirmBooking: "Rezervovat",
    confirmBookingSubmitting: "Odesíláme…",
    pendingHint: "Po odeslání se rezervace zobrazí v kalendáři majitele a bude čekat na potvrzení.",
    workingHours: "Pracovní doba",
    noTimeForDay: "Na tento den není volný čas.",
    noFreeDays: "V nejbližších dnech nejsou volné termíny.",
    freeTime: "Volné časy",
    freeDay: "Volno",
    closedDay: "Zavřeno",
    fullyBooked: "Obsazeno",
    dayAvailable: "Pracovní den",
    summary: "Vaše návštěva",
    chooseService: "Vyberte alespoň jednu službu",
    fromPrice: "od",
    reviews: "Online rezervace",
    verifiedRequest: "Žádost bude odeslána majiteli k potvrzení",
    companyInfo: "Informace o firmě",
    address: "Adresa",
    website: "Web",
    signInAs: "Přihlášeni jako",
    phoneError: "Zkontrolujte telefonní číslo.",
    photosTitle: "Fotografie",
    mobileSubtitle: "Vyberte službu a vhodný volný čas",
    trustLine: "Bez telefonů a zpráv — vybíráte jen volný čas",
    morning: "Ráno",
    afternoon: "Den",
    evening: "Večer",
    comment: "Komentář",
    commentPlaceholder: "Například: pohodlnější je napsat na Telegram",
    bookCta: "Rezervovat"
  },
  es: {
    ...businessCopy.en,
    breadcrumbHome: "Inicio",
    breadcrumbCatalog: "Catálogo",
    openUntil: "Abierto hasta",
    route: "Cómo llegar",
    services: "Servicios",
    team: "Especialistas",
    details: "Información",
    bookNow: "Reservar",
    bookingFlowTitle: "Reserva",
    serviceStep: "Servicios",
    specialistStep: "Especialista",
    timeStep: "Hora",
    confirmStep: "Confirmación",
    noPreference: "Sin preferencia",
    noPreferenceText: "Buscaremos el primer horario libre del equipo",
    select: "Elegir",
    selected: "Seleccionado",
    chooseSpecialist: "Elige especialista",
    chooseTime: "Elige hora",
    continue: "Continuar",
    goToConfirm: "Ir a confirmación",
    total: "Total",
    close: "Cerrar",
    back: "Atrás",
    duration: "Duración",
    minuteShort: "min",
    date: "Fecha",
    time: "Hora",
    specialist: "Especialista",
    selectedServices: "Servicios de la visita",
    addAnother: "Añadir otro servicio",
    signInGoogle: "Continuar con Google",
    signInHint: "Primero inicia sesión con Google, añade tu teléfono y confirma la reserva.",
    phoneTitle: "Teléfono para confirmar",
    phonePlaceholder: "Tu número",
    confirmBooking: "Reservar",
    confirmBookingSubmitting: "Enviando…",
    pendingHint: "Después de enviarla, la solicitud aparecerá en el calendario del propietario y esperará confirmación.",
    workingHours: "Horario",
    noTimeForDay: "No hay horarios libres para este día.",
    noFreeDays: "No hay turnos libres en los próximos días.",
    freeTime: "Horas disponibles",
    freeDay: "Disponible",
    closedDay: "Cerrado",
    fullyBooked: "Completo",
    dayAvailable: "Día laboral",
    summary: "Tu visita",
    chooseService: "Elige al menos un servicio",
    fromPrice: "desde",
    reviews: "Reserva online",
    verifiedRequest: "La solicitud se enviará al propietario para confirmación",
    companyInfo: "Información de la empresa",
    address: "Dirección",
    website: "Sitio web",
    signInAs: "Has iniciado sesión como",
    phoneError: "Comprueba el número de teléfono.",
    photosTitle: "Fotos",
    mobileSubtitle: "Elige un servicio y un horario libre cómodo",
    trustLine: "Sin llamadas ni mensajes — solo eliges un horario disponible",
    morning: "Mañana",
    afternoon: "Día",
    evening: "Tarde",
    comment: "Comentario",
    commentPlaceholder: "Por ejemplo: es más cómodo escribir por Telegram",
    bookCta: "Reservar"
  },
  de: {
    ...businessCopy.en,
    breadcrumbHome: "Startseite",
    breadcrumbCatalog: "Katalog",
    openUntil: "Geöffnet bis",
    route: "Route anzeigen",
    services: "Leistungen",
    team: "Spezialisten",
    details: "Über uns",
    bookNow: "Buchen",
    bookingFlowTitle: "Buchung",
    serviceStep: "Leistungen",
    specialistStep: "Spezialist",
    timeStep: "Zeit",
    confirmStep: "Bestätigung",
    noPreference: "Keine Präferenz",
    noPreferenceText: "Wir finden den frühesten freien Termin im Team",
    select: "Auswählen",
    selected: "Ausgewählt",
    chooseSpecialist: "Spezialisten wählen",
    chooseTime: "Zeit wählen",
    continue: "Weiter",
    goToConfirm: "Zur Bestätigung",
    total: "Gesamt",
    close: "Schließen",
    back: "Zurück",
    duration: "Dauer",
    minuteShort: "Min.",
    date: "Datum",
    time: "Zeit",
    specialist: "Spezialist",
    selectedServices: "Leistungen des Besuchs",
    addAnother: "Weitere Leistung hinzufügen",
    signInGoogle: "Mit Google fortfahren",
    signInHint: "Melden Sie sich zuerst mit Google an, fügen Sie Ihre Telefonnummer hinzu und bestätigen Sie die Buchung.",
    phoneTitle: "Telefon zur Bestätigung",
    phonePlaceholder: "Ihre Nummer",
    confirmBooking: "Buchen",
    confirmBookingSubmitting: "Wird gesendet…",
    pendingHint: "Nach dem Senden erscheint die Anfrage im Kalender des Inhabers und wartet auf Bestätigung.",
    workingHours: "Öffnungszeiten",
    noTimeForDay: "An diesem Tag gibt es keine freien Zeiten.",
    noFreeDays: "In den nächsten Tagen gibt es keine freien Termine.",
    freeTime: "Verfügbare Zeiten",
    freeDay: "Frei",
    closedDay: "Geschlossen",
    fullyBooked: "Ausgebucht",
    dayAvailable: "Arbeitstag",
    summary: "Dein Besuch",
    chooseService: "Wähle mindestens eine Leistung",
    fromPrice: "ab",
    reviews: "Online-Buchung",
    verifiedRequest: "Die Anfrage wird zur Bestätigung an den Inhaber gesendet",
    companyInfo: "Unternehmensdetails",
    address: "Adresse",
    website: "Website",
    signInAs: "Angemeldet als",
    phoneError: "Prüfen Sie die Telefonnummer.",
    photosTitle: "Fotos",
    mobileSubtitle: "Wählen Sie eine Leistung und eine passende freie Zeit",
    trustLine: "Ohne Anrufe und Nachrichten — Sie wählen nur freie Zeiten",
    morning: "Morgen",
    afternoon: "Tag",
    evening: "Abend",
    comment: "Kommentar",
    commentPlaceholder: "Zum Beispiel: Telegram ist bequemer",
    bookCta: "Buchen"
  }
});

function ConfirmBookingSubmitButton({
  disabled,
  label,
  loadingLabel
}: {
  disabled: boolean;
  label: string;
  loadingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="primary-button company-booking-gradient-button submit-button"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
    >
      {pending ? loadingLabel : label}
    </button>
  );
}

const bookingSteps: BookingStep[] = ["services", "specialists", "time", "confirm"];

const publicMenuLabel: Record<SiteLanguage, string> = {
  ru: "Меню",
  uk: "Меню",
  en: "Menu",
  fr: "Menu",
  pl: "Menu",
  cs: "Menu",
  es: "Menú",
  de: "Menü"
};

function getBookingStepLabel(step: BookingStep, t: BusinessCopy) {
  if (step === "services") return t.serviceStep;
  if (step === "specialists") return t.specialistStep;
  if (step === "time") return t.timeStep;
  return t.confirmStep;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthTitle(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatSelectedDate(dateKey: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(`${dateKey}T00:00:00`));
}

function formatWeekday(dateKey: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(`${dateKey}T00:00:00`));
}

function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return formatDateKey(date);
}

function addMonths(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

function getTodayDateKey() {
  return formatDateKey(new Date());
}

function getWeekStart(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const shift = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - shift);
  return formatDateKey(date);
}

function buildMonthDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const shift = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - shift);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      key: formatDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month.getMonth()
    };
  });
}

function formatMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0
  }).format(value);
}

function getStepIndex(step: BookingStep) {
  return bookingSteps.indexOf(step);
}

function fullName(member: TeamMember) {
  return `${member.firstName} ${member.lastName}`.trim();
}

function getSlotPeriod(slot: string) {
  const [hours = "0"] = slot.split(":");
  const hour = Number(hours);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getInitials(member: TeamMember) {
  return `${member.firstName.trim().slice(0, 1)}${member.lastName.trim().slice(0, 1)}`.toUpperCase();
}

function getDraftStorageKey(businessId: string) {
  return `timviz-public-booking-${businessId}`;
}

function formatWebsiteLabel(value: string) {
  if (!value.trim()) {
    return "";
  }

  try {
    const url = value.startsWith("http://") || value.startsWith("https://") ? new URL(value) : new URL(`https://${value}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? value;
  }
}

function buildMapEmbedUrl(lat: number | null, lon: number | null) {
  if (lat === null || lon === null) {
    return "";
  }

  const delta = 0.008;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function buildRouteUrl(address: string, lat: number | null, lon: number | null) {
  if (lat !== null && lon !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lon}`)}`;
  }

  if (address.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }

  return "";
}

function parseBookingDraft(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as {
      selectedServiceIds?: string[];
      selectedProfessionalId?: string;
      selectedDate?: string;
      selectedTime?: string;
      step?: BookingStep;
    };

    return {
      selectedServiceIds: Array.isArray(parsed.selectedServiceIds) ? parsed.selectedServiceIds : [],
      selectedProfessionalId: typeof parsed.selectedProfessionalId === "string" ? parsed.selectedProfessionalId : "",
      selectedDate: typeof parsed.selectedDate === "string" ? parsed.selectedDate : "",
      selectedTime: typeof parsed.selectedTime === "string" ? parsed.selectedTime : "",
      step: bookingSteps.includes(parsed.step as BookingStep) ? (parsed.step as BookingStep) : "services"
    };
  } catch {
    return null;
  }
}

export default function BusinessView({
  business,
  services,
  bookings,
  image,
  photos,
  team,
  initialLanguage,
  returnPath
}: BusinessViewProps) {
  const language = initialLanguage;
  const t = businessCopy[language];
  const locale = localeBySiteLanguage[language];
  const normalizedWorkSchedule = useMemo(() => normalizeWorkSchedule(business.workSchedule), [business.workSchedule]);
  const normalizedCustomSchedule = useMemo(
    () => normalizeCustomSchedule(business.customSchedule),
    [business.customSchedule]
  );
  const [activeSection, setActiveSection] = useState<StepKey>("services");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>("services");
  const [serviceCategory, setServiceCategory] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart(getTodayDateKey()));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState("Ukraine");
  const [localPhone, setLocalPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [authState, setAuthState] = useState<CustomerSessionState>({
    loading: true,
    authenticated: false,
    customer: null
  });
  const servicesSectionRef = useRef<HTMLElement | null>(null);
  const teamSectionRef = useRef<HTMLElement | null>(null);
  const detailsSectionRef = useRef<HTMLElement | null>(null);

  const allPhotos = useMemo(() => {
    const ordered = [image, ...photos].filter(Boolean);
    return ordered.filter((item, index) => ordered.indexOf(item) === index).slice(0, 6);
  }, [image, photos]);

  const teamMembers = useMemo(() => {
    if (team.length > 0) {
      return team;
    }

    return business.ownerProfessionalId
        ? [
          {
            id: business.ownerProfessionalId,
            firstName: business.name,
            lastName: "",
            role:
              language === "uk"
                ? "Власник"
                : language === "ru"
                  ? "Владелец"
                  : language === "fr"
                    ? "Propriétaire"
                    : language === "pl"
                      ? "Właściciel"
                      : language === "cs"
                        ? "Majitel"
                        : language === "es"
                          ? "Propietario"
                          : language === "de"
                            ? "Inhaber"
                            : "Owner",
            scope: "owner" as const,
            workScheduleMode: business.workScheduleMode,
            workSchedule: business.workSchedule,
            customSchedule: business.customSchedule
          }
        ]
      : [];
  }, [
    business.customSchedule,
    business.name,
    business.ownerProfessionalId,
    business.workSchedule,
    business.workScheduleMode,
    language,
    team
  ]);

  const companyPhoneCountry = useMemo(
    () => inferPhoneCountryFromAddress(business.address),
    [business.address]
  );

  const serviceGroups = useMemo(() => {
    const groups = new Map<string, ServiceRecord[]>();

    for (const service of services) {
      const category = service.category?.trim()
        ? localizeCategoryName(service.category.trim(), language)
        : t.services;
      const bucket = groups.get(category) ?? [];
      bucket.push(service);
      groups.set(category, bucket);
    }

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items
    }));
  }, [language, services, t.services]);

  const businessCategoryLabel = useMemo(() => {
    const primaryCategory = business.categories[0]?.trim();
    if (!primaryCategory) {
      return t.reviews;
    }

    return localizeCategoryName(primaryCategory, language);
  }, [business.categories, language, t.reviews]);

  function getLocalizedServiceNameLabel(service: ServiceRecord) {
    return localizeServiceName(service.name, language);
  }

  const servicesById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const selectedServiceIdSet = useMemo(() => new Set(selectedServiceIds), [selectedServiceIds]);
  const selectedServices = useMemo(
    () => selectedServiceIds.map((id) => servicesById.get(id)).filter((service): service is ServiceRecord => Boolean(service)),
    [selectedServiceIds, servicesById]
  );
  const visibleServices = useMemo(
    () => serviceGroups.find((group) => group.category === serviceCategory)?.items ?? services,
    [serviceCategory, serviceGroups, services]
  );
  const totalDurationMinutes = useMemo(
    () => selectedServices.reduce((sum, item) => sum + Math.max(5, item.durationMinutes ?? 60), 0),
    [selectedServices]
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, item) => sum + Math.max(0, item.price || 0), 0),
    [selectedServices]
  );
  const summaryServiceName = useMemo(
    () => selectedServices.map((service) => service.name).join(" + "),
    [selectedServices]
  );
  const primaryService = selectedServices[0] ?? null;
  const selectedProfessional = teamMembers.find((member) => member.id === selectedProfessionalId) ?? null;
  const phoneRule = getPhoneRule(phoneCountry);
  const mapEmbedUrl = useMemo(
    () => buildMapEmbedUrl(business.addressLat, business.addressLon),
    [business.addressLat, business.addressLon]
  );
  const websiteLabel = useMemo(() => formatWebsiteLabel(business.website), [business.website]);
  const routeUrl = useMemo(
    () => buildRouteUrl(business.address, business.addressLat, business.addressLon),
    [business.address, business.addressLat, business.addressLon]
  );

  useEffect(() => {
    if (serviceGroups.length && !serviceCategory) {
      setServiceCategory(serviceGroups[0].category);
    }
  }, [serviceCategory, serviceGroups]);

  useEffect(() => {
    const browserPhoneCountry =
      typeof window === "undefined"
        ? ""
        : inferPhoneCountryFromLocales([window.navigator.language, ...(window.navigator.languages ?? [])]);

    setPhoneCountry(companyPhoneCountry || browserPhoneCountry || "Ukraine");
  }, [companyPhoneCountry]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const draft = parseBookingDraft(window.localStorage.getItem(getDraftStorageKey(business.id)));

    if (!draft) {
      return;
    }

    if (draft.selectedServiceIds.length) {
      setSelectedServiceIds(draft.selectedServiceIds.filter((id) => servicesById.has(id)));
    } else {
      setSelectedServiceIds([]);
    }

    setSelectedProfessionalId(draft.selectedProfessionalId);
    setSelectedDate(draft.selectedDate);
    setSelectedTime(draft.selectedTime);
    setBookingStep(draft.step);
    setBookingOpen(draft.selectedServiceIds.length > 0 || Boolean(draft.selectedDate) || Boolean(draft.selectedTime));

    if (draft.selectedDate) {
      setVisibleMonth(new Date(`${draft.selectedDate}T00:00:00`));
      setWeekStart(getWeekStart(draft.selectedDate));
    }
  }, [business.id, servicesById]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!selectedServiceIds.length && !selectedDate && !selectedTime) {
      window.localStorage.removeItem(getDraftStorageKey(business.id));
      return;
    }

    window.localStorage.setItem(
      getDraftStorageKey(business.id),
      JSON.stringify({
        selectedServiceIds,
        selectedProfessionalId,
        selectedDate,
        selectedTime,
        step: bookingStep
      })
    );
  }, [bookingStep, business.id, selectedDate, selectedProfessionalId, selectedServiceIds, selectedTime]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/public/auth/session", { cache: "no-store" });
        const payload = (await response.json()) as {
          authenticated?: boolean;
          customer?: PublicCustomerSession | null;
        };

        if (cancelled) {
          return;
        }

        setAuthState({
          loading: false,
          authenticated: payload.authenticated === true,
          customer: payload.customer ?? null
        });
      } catch {
        if (cancelled) {
          return;
        }

        setAuthState({
          loading: false,
          authenticated: false,
          customer: null
        });
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const bookingsByProfessional = useMemo(() => {
    const map = new Map<string, BookingBusySlot[]>();

    for (const booking of bookings) {
      const key = booking.professionalId || "";
      const bucket = map.get(key) ?? [];
      bucket.push(booking);
      map.set(key, bucket);
    }

    return map;
  }, [bookings]);

  const professionalIdsForSlots = useMemo(() => {
    if (selectedProfessionalId) {
      return [selectedProfessionalId];
    }

    return teamMembers.map((member) => member.id);
  }, [selectedProfessionalId, teamMembers]);
  const shouldResolveSlots = bookingOpen && (bookingStep === "time" || bookingStep === "confirm");

  function getScheduleConfigForProfessional(professionalId: string) {
    const member = teamMembers.find((item) => item.id === professionalId);

    return {
      workScheduleMode: member?.workScheduleMode ?? business.workScheduleMode,
      workSchedule: member?.workSchedule ?? business.workSchedule,
      customSchedule: member?.customSchedule ?? business.customSchedule
    };
  }

  function getAvailableSlotsForDate(dateKey: string, professionalId: string) {
    if (!primaryService || !dateKey) {
      return [];
    }

    const professionalBookings = professionalId ? bookingsByProfessional.get(professionalId) ?? [] : bookings;
    const scheduleConfig = getScheduleConfigForProfessional(professionalId);

    return getPublicBookingSlots({
      config: {
        workScheduleMode: scheduleConfig.workScheduleMode,
        workSchedule: scheduleConfig.workSchedule,
        customSchedule: scheduleConfig.customSchedule,
        bookingIntervalMinutes: 15,
        services: services.map((service) => ({
          name: service.name,
          durationMinutes: service.durationMinutes ?? 60
        }))
      },
      date: dateKey,
      serviceName: primaryService.name,
      durationMinutesOverride: totalDurationMinutes,
      bookings: professionalBookings
    });
  }

  const availableSlots = useMemo(() => {
    if (!shouldResolveSlots || !selectedDate || !primaryService) {
      return [];
    }

    const combined = new Set<string>();

    for (const professionalId of professionalIdsForSlots) {
      for (const slot of getAvailableSlotsForDate(selectedDate, professionalId)) {
        combined.add(slot);
      }
    }

    return Array.from(combined).sort();
  }, [primaryService, professionalIdsForSlots, selectedDate, shouldResolveSlots, totalDurationMinutes]);

  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const availabilityByDate = useMemo(() => {
    const map = new Map<string, { state: "closed" | "available" | "full"; slots: number }>();

    if (!shouldResolveSlots) {
      return map;
    }

    for (const day of monthDays) {
      if (!primaryService) {
        map.set(day.key, { state: "closed", slots: 0 });
        continue;
      }

      const slots = new Set<string>();
      let hasWorkingDay = false;
      for (const professionalId of professionalIdsForSlots) {
        const scheduleConfig = getScheduleConfigForProfessional(professionalId);
        const schedule = getDayScheduleForMode(
          day.key,
          normalizeWorkSchedule(scheduleConfig.workSchedule),
          normalizeCustomSchedule(scheduleConfig.customSchedule),
          scheduleConfig.workScheduleMode
        );

        if (schedule?.enabled) {
          hasWorkingDay = true;
        }

        for (const slot of getAvailableSlotsForDate(day.key, professionalId)) {
          slots.add(slot);
        }
      }

      if (!hasWorkingDay) {
        map.set(day.key, { state: "closed", slots: 0 });
        continue;
      }

      map.set(day.key, {
        state: slots.size > 0 ? "available" : "full",
        slots: slots.size
      });
    }

    return map;
  }, [monthDays, primaryService, professionalIdsForSlots, shouldResolveSlots]);

  useEffect(() => {
    if (!shouldResolveSlots) {
      return;
    }

    if (!primaryService) {
      setSelectedDate("");
      setSelectedTime("");
      return;
    }

    const today = getTodayDateKey();

    if (selectedDate && availableSlots.length > 0) {
      return;
    }

    for (let offset = 0; offset < 60; offset += 1) {
      const dateKey = addDays(today, offset);
      const slots = new Set<string>();

      for (const professionalId of professionalIdsForSlots) {
        for (const slot of getAvailableSlotsForDate(dateKey, professionalId)) {
          slots.add(slot);
        }
      }

      if (slots.size > 0) {
        setSelectedDate(dateKey);
        setVisibleMonth(new Date(`${dateKey}T00:00:00`));
        setWeekStart(getWeekStart(dateKey));
        return;
      }
    }
  }, [availableSlots.length, primaryService, professionalIdsForSlots, selectedDate, shouldResolveSlots]);

  useEffect(() => {
    if (!shouldResolveSlots) {
      return;
    }

    if (!selectedDate) {
      return;
    }

    if (availableSlots.length === 0) {
      setSelectedTime("");
      return;
    }

    setSelectedTime((current) => (current && availableSlots.includes(current) ? current : availableSlots[0]));
  }, [availableSlots, selectedDate, shouldResolveSlots]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const dateKey = addDays(weekStart, index);
      return {
        dateKey,
        availability: availabilityByDate.get(dateKey) ?? { state: "closed" as const, slots: 0 }
      };
    });
  }, [availabilityByDate, weekStart]);
  const groupedAvailableSlots = useMemo(() => {
    const groups = [
      { key: "morning", label: t.morning, slots: [] as string[] },
      { key: "afternoon", label: t.afternoon, slots: [] as string[] },
      { key: "evening", label: t.evening, slots: [] as string[] }
    ];

    for (const slot of availableSlots) {
      const group = groups.find((item) => item.key === getSlotPeriod(slot));
      group?.slots.push(slot);
    }

    return groups.filter((group) => group.slots.length > 0);
  }, [availableSlots, t.afternoon, t.evening, t.morning]);

  function openBookingFlow(serviceId?: string) {
    if (serviceId) {
      setSelectedServiceIds([serviceId]);
    }

    setBookingStep("services");
    setBookingOpen(true);
  }

  function closeBookingFlow() {
    setBookingOpen(false);
    setMonthPickerOpen(false);
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) => {
      const currentIds = new Set(current);
      if (currentIds.has(serviceId)) {
        return current.filter((item) => item !== serviceId);
      }

      return [...current, serviceId];
    });
  }

  function canGoToNextStep() {
    if (bookingStep === "services") {
      return selectedServices.length > 0;
    }

    if (bookingStep === "specialists") {
      return true;
    }

    if (bookingStep === "time") {
      return Boolean(selectedDate && selectedTime);
    }

    return authState.authenticated;
  }

  function goNext() {
    const currentIndex = getStepIndex(bookingStep);
    if (currentIndex < bookingSteps.length - 1 && canGoToNextStep()) {
      setBookingStep(bookingSteps[currentIndex + 1]);
    }
  }

  function goBack() {
    const currentIndex = getStepIndex(bookingStep);
    if (currentIndex > 0) {
      setBookingStep(bookingSteps[currentIndex - 1]);
      return;
    }

    closeBookingFlow();
  }

  function scrollToSection(section: StepKey) {
    setActiveSection(section);

    const sectionRef =
      section === "services"
        ? servicesSectionRef
        : section === "team"
          ? teamSectionRef
          : detailsSectionRef;

    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  const fullPhone = buildInternationalPhone(phoneCountry, localPhone);
  const returnToUrl =
    typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : returnPath;

  function openGoogleCustomerAuth() {
    const telegramRuntime = (
      window as Window & {
        Telegram?: { WebApp?: TelegramRuntime };
      }
    ).Telegram?.WebApp;
    const returnTargetUrl = new URL(returnToUrl, window.location.origin);
    if (telegramRuntime?.initData) {
      returnTargetUrl.searchParams.set("source", "telegram");
      returnTargetUrl.searchParams.set("startapp", "calendar");
    }
    const relative = `/api/public/auth/google/start?returnTo=${encodeURIComponent(
      `${returnTargetUrl.pathname}${returnTargetUrl.search}`
    )}`;
    const absolute = new URL(relative, window.location.origin).toString();

    if (telegramRuntime?.openLink && telegramRuntime?.initData) {
      telegramRuntime.openLink(absolute, { try_instant_view: false });
      return;
    }

    window.location.assign(absolute);
  }

  function renderSummary(mode: "page" | "modal" = "modal") {
    const hasSelection = selectedServices.length > 0;

    return (
      <aside className="company-booking-summary">
        <div className="company-booking-summary-card">
          <div className="company-booking-summary-brand">
            <img src={allPhotos[0]} alt={business.name} />
            <div>
              <strong>{business.name}</strong>
              <span>{business.address}</span>
            </div>
          </div>

          {hasSelection ? (
            <>
              <div className="company-booking-summary-list">
                {selectedServices.map((service) => (
                  <div key={service.id} className="company-booking-summary-line">
                    <div>
                      <strong>{getLocalizedServiceNameLabel(service)}</strong>
                      <span>
                        {service.durationMinutes ?? 60} {t.minuteShort}
                      </span>
                    </div>
                    <strong>{formatMoney(service.price, locale)}</strong>
                  </div>
                ))}
              </div>

              <div className="company-booking-summary-total">
                <span>{t.total}</span>
                <strong>{formatMoney(totalPrice, locale)}</strong>
              </div>

              {selectedProfessional ? (
                <div className="company-booking-summary-specialist">
                  <ProfileAvatar
                    avatarUrl={selectedProfessional.avatarUrl}
                    initials={getInitials(selectedProfessional)}
                    label={fullName(selectedProfessional)}
                    className="company-team-avatar"
                    imageClassName="company-team-avatar-image"
                    fallbackClassName="company-team-avatar-fallback"
                  />
                  <div className="company-booking-summary-meta">
                    <span>{t.specialist}</span>
                    <strong>{fullName(selectedProfessional)}</strong>
                  </div>
                </div>
              ) : null}
              {selectedDate ? (
                <div className="company-booking-summary-meta">
                  <span>{t.date}</span>
                  <strong>{formatSelectedDate(selectedDate, locale)}</strong>
                </div>
              ) : null}
              {selectedTime ? (
                <div className="company-booking-summary-meta">
                  <span>{t.time}</span>
                  <strong>
                    {selectedTime} - {addMinutesToTime(selectedTime, totalDurationMinutes)}
                  </strong>
                </div>
              ) : null}
            </>
          ) : (
            <div className="company-booking-summary-empty">
              <strong>{t.chooseService}</strong>
              <span>{t.verifiedRequest}</span>
            </div>
          )}

          {mode === "modal" && bookingStep === "time" ? (
            <button
              type="button"
              className="primary-button company-booking-gradient-button company-summary-action"
              onClick={goNext}
              disabled={!canGoToNextStep()}
            >
              {t.goToConfirm}
            </button>
          ) : null}

          {mode === "page" ? (
            <button
              type="button"
              className="primary-button company-summary-cta"
              onClick={() => openBookingFlow()}
              disabled={business.allowOnlineBooking !== true}
            >
              {t.bookNow}
            </button>
          ) : null}
        </div>
      </aside>
    );
  }

  return (
    <main className="company-page">
      <header className="public-header company-header">
        <a className="public-logo" href={getLocalizedPath(language)}>
          <BrandLogo />
        </a>
        <nav className="public-nav" aria-label="Company page navigation">
          <PublicHeaderAuthMenu language={language} />
          <a href={getLocalizedPath(language, "/catalog")} className="public-login">
            {t.breadcrumbCatalog}
          </a>
          <details className="public-menu">
            <summary aria-label={publicMenuLabel[language]} title={publicMenuLabel[language]}>
              <span>{publicMenuLabel[language]}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <a
                href="#services"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("services");
                }}
              >
                {t.services}
              </a>
              <a
                href="#team"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("team");
                }}
              >
                {t.team}
              </a>
              <a
                href="#details"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("details");
                }}
              >
                {t.details}
              </a>
            </div>
          </details>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="company-shell">
        <nav className="company-breadcrumbs" aria-label="Breadcrumb">
          <a href={getLocalizedPath(language)}>{t.breadcrumbHome}</a>
          <span>•</span>
          <a href={getLocalizedPath(language, "/catalog")}>{t.breadcrumbCatalog}</a>
          <span>•</span>
          <span>{business.name}</span>
        </nav>

        <section className="company-hero">
          <div className="company-hero-main">
            <div className="company-hero-copy">
              <div className="company-mobile-hero-brand">
                <img src={allPhotos[0]} alt={business.name} />
                <span>{businessCategoryLabel}</span>
              </div>
              <h1>{business.name}</h1>
              <p className="company-hero-description">{t.mobileSubtitle}</p>
              <small className="company-trust-line">{t.trustLine}</small>
              <div className="company-hero-meta">
                <span className="company-work-status">● {t.openUntil} 18:00</span>
                <span className="company-hero-address">{business.address}</span>
                {business.website ? (
                  <a href={business.website} target="_blank" rel="noreferrer">
                    {websiteLabel || t.website}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="company-gallery-grid" id="photos">
              <figure className="company-gallery-main">
                <img src={allPhotos[0]} alt={business.name} />
              </figure>
              <div className="company-gallery-stack">
                {allPhotos.slice(1, 3).map((photo, index) => (
                  <figure key={`${photo}-${index}`}>
                    <img src={photo} alt={`${business.name} ${index + 2}`} />
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="company-section-tabs">
          <button
            type="button"
            className={activeSection === "services" ? "active" : ""}
            onClick={() => scrollToSection("services")}
          >
            {t.services}
          </button>
          <button type="button" className={activeSection === "team" ? "active" : ""} onClick={() => scrollToSection("team")}>
            {t.team}
          </button>
          <button
            type="button"
            className={activeSection === "details" ? "active" : ""}
            onClick={() => scrollToSection("details")}
          >
            {t.details}
          </button>
        </div>

        <section className="company-layout">
          <div className="company-content">
            <section className="company-panel" id="services" ref={servicesSectionRef}>
              <div className="company-panel-head">
                <h2>{t.services}</h2>
                {!business.allowOnlineBooking ? <span className="company-status-pill">{t.onlineBookingOff}</span> : null}
              </div>

              <div className="company-category-tabs">
                {serviceGroups.map((group) => (
                  <button
                    key={group.category}
                    type="button"
                    className={serviceCategory === group.category ? "active" : ""}
                    onClick={() => setServiceCategory(group.category)}
                  >
                    {group.category}
                  </button>
                ))}
              </div>

              <div className="company-service-list">
                {visibleServices.map((service) => (
                  <article className="company-service-card" key={service.id}>
                    <div>
                      <h3>{getLocalizedServiceNameLabel(service)}</h3>
                      <p>
                        {service.durationMinutes ?? 60} {t.minuteShort}
                      </p>
                      <span>
                        {t.fromPrice} {formatMoney(service.price, locale)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="company-book-button"
                      onClick={() => openBookingFlow(service.id)}
                      disabled={business.allowOnlineBooking !== true}
                    >
                      {t.bookNow}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="company-panel" id="team" ref={teamSectionRef}>
              <div className="company-panel-head">
                <h2>{t.team}</h2>
              </div>
              <div className="company-team-grid">
                {teamMembers.map((member) => (
                  <article className="company-team-card" key={member.id}>
                    <ProfileAvatar
                      avatarUrl={member.avatarUrl}
                      initials={getInitials(member)}
                      label={fullName(member)}
                      className="company-team-avatar"
                      imageClassName="company-team-avatar-image"
                      fallbackClassName="company-team-avatar-fallback"
                    />
                    <strong>{fullName(member)}</strong>
                    <span>{member.role}</span>
                    <button type="button" onClick={() => {
                      setSelectedProfessionalId(member.id);
                      openBookingFlow();
                      setBookingStep("specialists");
                    }}>
                      {t.bookNow}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="company-panel" id="details" ref={detailsSectionRef}>
              <div className="company-panel-head">
                <h2>{t.companyInfo}</h2>
              </div>

              <div className="company-info-grid">
                <div className="company-info-card">
                  <strong>{t.address}</strong>
                  <p>{business.address || "—"}</p>
                  {routeUrl ? (
                    <a
                      className="company-route-link"
                      href={routeUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.route}
                    </a>
                  ) : null}
                </div>
                <div className="company-info-card">
                  <strong>{t.workingHours}</strong>
                  <div className="company-hours-list">
                    {workDays.map((day, index) => (
                      <div key={day.key}>
                        <span>{formatWeekday(addDays(getTodayDateKey(), index), locale)}</span>
                        <strong>
                          {normalizedWorkSchedule[day.key]?.enabled
                            ? `${normalizedWorkSchedule[day.key].startTime} - ${normalizedWorkSchedule[day.key].endTime}`
                            : t.closedDay}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {mapEmbedUrl ? (
                <div className="company-map-card">
                  <iframe
                    title={`${business.name} map`}
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}
            </section>
          </div>

          <div className="company-side-rail">{renderSummary("page")}</div>
        </section>
      </section>

      {bookingOpen ? (
        <div className="company-booking-modal" role="dialog" aria-modal="true" aria-label={t.bookingFlowTitle}>
          <div className="company-booking-modal-shell">
            <button type="button" className="company-modal-close" onClick={closeBookingFlow} aria-label={t.close}>
              ×
            </button>
            <div className="company-booking-modal-content">
              <div className="company-booking-flow">
                <div className="company-booking-topbar">
                  <button type="button" className="company-modal-back" onClick={goBack} aria-label={t.back}>
                    ←
                  </button>
                  <div className="company-booking-progress">
                    {bookingSteps.map((step) => (
                      <span
                        key={step}
                        className={getStepIndex(step) === getStepIndex(bookingStep) ? "active" : getStepIndex(step) < getStepIndex(bookingStep) ? "done" : ""}
                      >
                        {getBookingStepLabel(step, t)}
                      </span>
                    ))}
                  </div>
                </div>

                    {bookingStep === "services" ? (
                      <section className="company-booking-step">
                        <header className="company-booking-step-head">
                      <h2>{t.selectedServices}</h2>
                      <p>{t.addAnother}</p>
                    </header>

                    <div className="company-category-tabs booking-flow-category-tabs">
                      {serviceGroups.map((group) => (
                        <button
                          key={group.category}
                          type="button"
                          className={serviceCategory === group.category ? "active" : ""}
                          onClick={() => setServiceCategory(group.category)}
                        >
                          {group.category}
                        </button>
                      ))}
                    </div>

                    <div className="company-flow-list">
                      {visibleServices.map((service) => {
                        const active = selectedServiceIdSet.has(service.id);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            className={`company-flow-card ${active ? "active" : ""}`}
                            onClick={() => toggleService(service.id)}
                          >
                            <div>
                              <strong>{getLocalizedServiceNameLabel(service)}</strong>
                              <span>
                                {service.durationMinutes ?? 60} {t.minuteShort}
                              </span>
                              <small>{service.price ? formatMoney(service.price, locale) : t.fromPrice}</small>
                              <small>
                                {service.category?.trim()
                                  ? localizeCategoryName(service.category.trim(), language)
                                  : t.services}
                              </small>
                            </div>
                            <div className="company-flow-card-side">
                              <strong>{formatMoney(service.price, locale)}</strong>
                              <span>{active ? "✓" : "+"}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {bookingStep === "specialists" ? (
                  <section className="company-booking-step">
                    <header className="company-booking-step-head">
                      <h2>{t.chooseSpecialist}</h2>
                    </header>

                    <div className="company-flow-list">
                      <button
                        type="button"
                        className={`company-flow-card ${selectedProfessionalId === "" ? "active" : ""}`}
                        onClick={() => setSelectedProfessionalId("")}
                      >
                        <div>
                          <strong>{t.noPreference}</strong>
                          <span>{t.noPreferenceText}</span>
                        </div>
                        <div className="company-flow-card-side">
                          <span>{selectedProfessionalId === "" ? "✓" : t.select}</span>
                        </div>
                      </button>

                      {teamMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          className={`company-flow-card ${selectedProfessionalId === member.id ? "active" : ""}`}
                          onClick={() => setSelectedProfessionalId(member.id)}
                        >
                          <div className="company-flow-member">
                            <ProfileAvatar
                              avatarUrl={member.avatarUrl}
                              initials={getInitials(member)}
                              label={fullName(member)}
                              className="company-team-avatar"
                              imageClassName="company-team-avatar-image"
                              fallbackClassName="company-team-avatar-fallback"
                            />
                            <div>
                              <strong>{fullName(member)}</strong>
                              <span>{member.role}</span>
                            </div>
                          </div>
                          <div className="company-flow-card-side">
                            <span>{selectedProfessionalId === member.id ? "✓" : t.select}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                {bookingStep === "time" ? (
                  <section className="company-booking-step">
                    <header className="company-booking-step-head">
                      <h2>{t.chooseTime}</h2>
                      <button type="button" className="company-calendar-toggle" onClick={() => setMonthPickerOpen((value) => !value)} aria-label={t.date}>
                        🗓
                      </button>
                    </header>

                    <div className="company-week-strip">
                      {weekDays.map((day) => (
                        <button
                          key={day.dateKey}
                          type="button"
                          className={`company-week-day ${selectedDate === day.dateKey ? "active" : ""} ${day.availability.state} ${day.dateKey === getTodayDateKey() ? "today" : ""}`}
                          onClick={() => {
                            setSelectedDate(day.dateKey);
                            setVisibleMonth(new Date(`${day.dateKey}T00:00:00`));
                          }}
                        >
                          <strong>{new Date(`${day.dateKey}T00:00:00`).getDate()}</strong>
                          <span>{formatWeekday(day.dateKey, locale)}</span>
                          <small>{day.availability.slots ? `${day.availability.slots}` : day.availability.state === "closed" ? t.closedDay : t.fullyBooked}</small>
                        </button>
                      ))}
                    </div>

                    {monthPickerOpen ? (
                      <div className="company-month-picker">
                        <div className="public-month-head">
                          <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, -1))}>
                            ‹
                          </button>
                          <strong>{formatMonthTitle(visibleMonth, locale)}</strong>
                          <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>
                            ›
                          </button>
                        </div>
                        <div className="public-month-grid">
                          {monthDays.map((day) => {
                            const availability = availabilityByDate.get(day.key) ?? { state: "closed", slots: 0 };
                            return (
                              <button
                                key={day.key}
                                type="button"
                                className={`${day.inMonth ? "" : "muted"} ${selectedDate === day.key ? "active" : ""} company-month-${availability.state}`}
                                onClick={() => {
                                  setSelectedDate(day.key);
                                  setWeekStart(getWeekStart(day.key));
                                  setMonthPickerOpen(false);
                                }}
                              >
                                {day.day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="company-slot-groups">
                      {groupedAvailableSlots.map((group) => (
                        <section key={group.key} className="company-slot-group">
                          <strong>{group.label}</strong>
                          <div className="company-slot-list">
                            {group.slots.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                className={`company-slot-item ${selectedTime === slot ? "active" : ""}`}
                                onClick={() => setSelectedTime(slot)}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>

                    {!availableSlots.length ? (
                      <div className="company-empty-hint">
                        <strong>{t.noTimeForDay}</strong>
                        <span>{t.noFreeDays}</span>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="primary-button company-booking-gradient-button company-time-cta"
                      onClick={goNext}
                      disabled={!canGoToNextStep()}
                    >
                      {t.goToConfirm}
                    </button>
                  </section>
                ) : null}

                {bookingStep === "confirm" ? (
                  <section className="company-booking-step">
                    <header className="company-booking-step-head">
                      <h2>{t.confirmStep}</h2>
                      <p>{t.pendingHint}</p>
                    </header>

                    {!authState.loading && !authState.authenticated ? (
                      <div className="company-auth-card">
                        <strong>{t.signInGoogle}</strong>
                        <p>{t.signInHint}</p>
                        <button
                          type="button"
                          className="primary-button company-booking-gradient-button company-google-button"
                          onClick={openGoogleCustomerAuth}
                        >
                          {t.signInGoogle}
                        </button>
                      </div>
                    ) : null}

                    {authState.loading ? (
                      <div className="company-auth-card">
                        <p>Loading…</p>
                      </div>
                    ) : null}

                    {authState.authenticated && authState.customer ? (
                      <form
                        action={createBusinessBookingAction}
                        className="company-confirm-form"
                        onSubmit={(event) => {
                          if (!isPhoneValid(phoneCountry, localPhone)) {
                            event.preventDefault();
                            setPhoneError(t.phoneError);
                            return;
                          }

                          if (typeof window !== "undefined") {
                            window.localStorage.removeItem(getDraftStorageKey(business.id));
                          }
                        }}
                      >
                        <input type="hidden" name="businessId" value={business.id} />
                        <input type="hidden" name="serviceName" value={summaryServiceName} />
                        <input
                          type="hidden"
                          name="serviceNamesJson"
                          value={JSON.stringify(selectedServices.map((service) => service.name))}
                        />
                        <input type="hidden" name="professionalId" value={selectedProfessionalId} />
                        <input type="hidden" name="appointmentDate" value={selectedDate} />
                        <input type="hidden" name="appointmentTime" value={selectedTime} />
                        <input type="hidden" name="customerName" value={authState.customer.fullName || authState.customer.email} />
                        <input type="hidden" name="customerEmail" value={authState.customer.email} />
                        <input type="hidden" name="customerPhone" value={fullPhone} />
                        <input type="hidden" name="customerPhoneCountry" value={phoneCountry} />
                        <input type="hidden" name="customerPhoneLocal" value={localPhone} />
                        <input type="hidden" name="customerNotes" value={customerNotes} />
                        <input type="hidden" name="returnPath" value={returnPath} />

                        <div className="company-auth-card company-auth-card-active">
                          <span>{t.signInAs}</span>
                          <strong>{authState.customer.fullName || authState.customer.email}</strong>
                          <small>{authState.customer.email}</small>
                        </div>

                        <label className="field">
                          <span>{t.phoneTitle}</span>
                          <div className="salon-phone-row">
                            <select
                              className="salon-phone-prefix"
                              value={phoneCountry}
                              onChange={(event) => {
                                const nextCountry = event.target.value;
                                const nextRule = getPhoneRule(nextCountry);
                                setPhoneCountry(nextCountry);
                                setLocalPhone(formatPhoneLocal(onlyPhoneDigits(localPhone), nextRule));
                                setPhoneError("");
                              }}
                            >
                              {phoneCountries.map((country) => {
                                const rule = getPhoneRule(country);
                                return (
                                  <option key={country} value={country}>
                                    {`${rule.prefix} · ${country}`}
                                  </option>
                                );
                              })}
                            </select>
                            <input
                              className="salon-phone-input"
                              type="tel"
                              inputMode="numeric"
                              required
                              placeholder={phoneRule.placeholder || t.phonePlaceholder}
                              value={localPhone}
                              onChange={(event) => {
                                setLocalPhone(formatPhoneLocal(event.target.value, phoneRule));
                                setPhoneError("");
                              }}
                              onBlur={() => {
                                if (localPhone.trim() && !isPhoneValid(phoneCountry, localPhone)) {
                                  setPhoneError(t.phoneError);
                                }
                              }}
                            />
                          </div>
                        </label>

                        {phoneError ? <p className="field-error">{phoneError}</p> : null}

                        <label className="field">
                          <span>{t.comment}</span>
                          <textarea
                            className="textarea company-comment-input"
                            value={customerNotes}
                            onChange={(event) => setCustomerNotes(event.target.value)}
                            placeholder={t.commentPlaceholder}
                            rows={3}
                          />
                        </label>

                        <div className="company-mobile-confirm-summary">
                          <strong>{selectedServices.map((service) => getLocalizedServiceNameLabel(service)).join(" + ")}</strong>
                          <span>{selectedDate ? formatSelectedDate(selectedDate, locale) : ""}{selectedTime ? ` · ${selectedTime}` : ""}</span>
                          <span>{selectedProfessional ? `${t.specialist}: ${fullName(selectedProfessional)}` : `${t.specialist}: ${t.noPreference}`}</span>
                          <span>{`${t.fromPrice} ${formatMoney(totalPrice, locale)}`}</span>
                        </div>

                        <ConfirmBookingSubmitButton
                          disabled={!selectedTime || !selectedDate || !selectedServices.length}
                          label={t.bookCta}
                          loadingLabel={t.confirmBookingSubmitting}
                        />
                      </form>
                    ) : null}
                  </section>
                ) : null}
              </div>

              {renderSummary("modal")}
            </div>

            <div className="company-booking-modal-footer">
              {bookingStep !== "confirm" ? (
                <button
                  type="button"
                  className="primary-button company-booking-gradient-button company-modal-next"
                  onClick={goNext}
                  disabled={!canGoToNextStep()}
                >
                  {bookingStep === "time" ? t.goToConfirm : t.continue}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
