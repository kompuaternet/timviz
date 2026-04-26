"use client";

import { useEffect, useMemo, useState } from "react";
import type { ServiceRecord, BusinessRecord } from "../../../lib/pro-data";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneRule,
  getPhoneValidationMessage,
  inferPhoneCountryFromAddress,
  inferPhoneCountryFromLocale,
  isPhoneValid,
  onlyPhoneDigits,
  phoneCountries
} from "../../../lib/phone-format";
import { findNextPublicBookingDate, getPublicBookingSlots } from "../../../lib/public-booking";
import { getDaySchedule, normalizeCustomSchedule, normalizeWorkSchedule } from "../../../lib/work-schedule";
import { getLocalizedPath, type SiteLanguage } from "../../../lib/site-language";
import { createBusinessBookingAction } from "./actions";
import { useSiteLanguage } from "../../useSiteLanguage";

type BusinessViewProps = {
  business: BusinessRecord;
  services: ServiceRecord[];
  bookings: {
    appointmentDate: string;
    appointmentTime: string;
    endTime: string;
    serviceName: string;
  }[];
  image: string;
  initialLanguage: SiteLanguage;
  returnPath: string;
};

type BusinessCopy = {
  eyebrow: string;
  heroFallback: string;
  bookingTitle: string;
  bookingSubtitle: string;
  servicePickerTitle: string;
  selectedServices: string;
  chooseService: string;
  addAnotherService: string;
  onlineBookingClosed: string;
  onlineBookingClosedText: string;
  requestPending: string;
  requestPendingText: string;
  date: string;
  freeDays: string;
  noFreeDays: string;
  availableSlots: string;
  noSlots: string;
  noSlotsForDay: string;
  chooseTimeError: string;
  totalDuration: string;
  totalPrice: string;
  minuteShort: string;
  name: string;
  phone: string;
  comment: string;
  namePlaceholder: string;
  commentPlaceholder: string;
  submit: string;
  backToCatalog: string;
  closedDay: string;
  fullDay: string;
  availableDay: string;
  workDay: string;
};

const businessCopy: Record<SiteLanguage, BusinessCopy> = {
  ru: {
    eyebrow: "Онлайн-запись",
    heroFallback: "Запись на услуги компании",
    bookingTitle: "Выберите услуги и удобное окно",
    bookingSubtitle: "Сначала соберите визит, затем выберите свободный день и время.",
    servicePickerTitle: "Услуги визита",
    selectedServices: "Выбрано",
    chooseService: "Выбрать услугу",
    addAnotherService: "Добавить ещё услугу",
    onlineBookingClosed: "Онлайн-запись выключена",
    onlineBookingClosedText:
      "Владелец бизнеса пока не принимает записи с сайта. Карточка компании остаётся доступной для просмотра.",
    requestPending: "Заявка на запись",
    requestPendingText:
      "После отправки заявка появится в календаре владельца и будет ждать подтверждения.",
    date: "Дата",
    freeDays: "Календарь записи",
    noFreeDays: "На ближайшие дни нет свободных окон под выбранные услуги.",
    availableSlots: "Свободное время",
    noSlots: "Для выбранных услуг пока нет доступных окон.",
    noSlotsForDay: "На этот день свободных окон нет.",
    chooseTimeError: "Выберите время записи.",
    totalDuration: "Длительность",
    totalPrice: "Стоимость",
    minuteShort: "мин",
    name: "Имя",
    phone: "Телефон",
    comment: "Комментарий",
    namePlaceholder: "Например, Анна",
    commentPlaceholder: "Можно указать пожелания к визиту",
    submit: "Отправить заявку",
    backToCatalog: "Вернуться в каталог",
    closedDay: "Выходной",
    fullDay: "Все окна заняты",
    availableDay: "Есть свободное время",
    workDay: "Рабочий день"
  },
  uk: {
    eyebrow: "Онлайн-запис",
    heroFallback: "Запис на послуги компанії",
    bookingTitle: "Оберіть послуги та зручне вікно",
    bookingSubtitle: "Спочатку зберіть візит, потім оберіть вільний день і час.",
    servicePickerTitle: "Послуги візиту",
    selectedServices: "Обрано",
    chooseService: "Обрати послугу",
    addAnotherService: "Додати ще послугу",
    onlineBookingClosed: "Онлайн-запис вимкнено",
    onlineBookingClosedText:
      "Власник бізнесу поки що не приймає записи із сайту. Картка компанії лишається доступною для перегляду.",
    requestPending: "Заявка на запис",
    requestPendingText:
      "Після відправлення заявка з’явиться в календарі власника й чекатиме на підтвердження.",
    date: "Дата",
    freeDays: "Календар запису",
    noFreeDays: "На найближчі дні немає вільних вікон під обрані послуги.",
    availableSlots: "Вільний час",
    noSlots: "Для обраних послуг поки немає доступних вікон.",
    noSlotsForDay: "На цей день вільних вікон немає.",
    chooseTimeError: "Оберіть час запису.",
    totalDuration: "Тривалість",
    totalPrice: "Вартість",
    minuteShort: "хв",
    name: "Ім'я",
    phone: "Телефон",
    comment: "Коментар",
    namePlaceholder: "Наприклад, Анна",
    commentPlaceholder: "Можна вказати побажання до візиту",
    submit: "Надіслати заявку",
    backToCatalog: "Повернутися в каталог",
    closedDay: "Вихідний",
    fullDay: "Усі вікна зайняті",
    availableDay: "Є вільний час",
    workDay: "Робочий день"
  },
  en: {
    eyebrow: "Online booking",
    heroFallback: "Business service booking",
    bookingTitle: "Choose services and a time slot",
    bookingSubtitle: "Build the visit first, then pick a working day and available time.",
    servicePickerTitle: "Visit services",
    selectedServices: "Selected",
    chooseService: "Choose service",
    addAnotherService: "Add another service",
    onlineBookingClosed: "Online booking is turned off",
    onlineBookingClosedText:
      "The business owner does not accept bookings from the public site yet. The business page is still available for viewing.",
    requestPending: "Booking request",
    requestPendingText:
      "After you send it, the request appears in the owner's calendar and waits for confirmation.",
    date: "Date",
    freeDays: "Booking calendar",
    noFreeDays: "There are no free slots for the selected services in the coming days.",
    availableSlots: "Available time",
    noSlots: "No available slots for the selected services yet.",
    noSlotsForDay: "There are no free slots on this day.",
    chooseTimeError: "Choose a booking time.",
    totalDuration: "Duration",
    totalPrice: "Price",
    minuteShort: "min",
    name: "Name",
    phone: "Phone",
    comment: "Comment",
    namePlaceholder: "For example, Anna",
    commentPlaceholder: "Add any notes for the visit",
    submit: "Send request",
    backToCatalog: "Back to catalog",
    closedDay: "Closed",
    fullDay: "No free time",
    availableDay: "Free time available",
    workDay: "Working day"
  }
};

type MonthDay = {
  key: string;
  day: number;
  inMonth: boolean;
  date: Date;
};

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTodayDateKey() {
  return formatDateKey(new Date());
}

function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return formatDateKey(date);
}

function addMonths(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

function buildMonthDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const shift = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - shift);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      key: formatDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
      date
    } satisfies MonthDay;
  });
}

function getBrowserPhoneCountry() {
  if (typeof window === "undefined") {
    return "";
  }

  const candidates = [navigator.language, ...(navigator.languages ?? [])].filter(Boolean);

  for (const candidate of candidates) {
    const country = inferPhoneCountryFromLocale(candidate);
    if (country) {
      return country;
    }
  }

  return "";
}

function getPhoneErrorText(language: SiteLanguage, country: string) {
  const digits = getPhoneRule(country).digits;

  if (language === "uk") {
    return `Перевірте номер: потрібно ${digits} цифр без коду країни.`;
  }

  if (language === "en") {
    return `Check the number: ${digits} digits are required without the country code.`;
  }

  return getPhoneValidationMessage(country);
}

function formatMoney(value: number, locale: string, language: SiteLanguage) {
  const currency = language === "en" ? "UAH" : "UAH";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
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

function getTotalDuration(services: ServiceRecord[]) {
  return services.reduce((sum, service) => sum + Math.max(5, service.durationMinutes ?? 60), 0);
}

function getCombinedServiceName(services: ServiceRecord[]) {
  return services.map((service) => service.name).join(" + ");
}

export default function BusinessView({
  business,
  services,
  bookings,
  image,
  initialLanguage,
  returnPath
}: BusinessViewProps) {
  const language = useSiteLanguage(initialLanguage, true);
  const t = businessCopy[language];
  const locale = language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU";
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [selectedDate, setSelectedDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("Ukraine");
  const [localPhone, setLocalPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const weekdays = useMemo(
    () =>
      language === "uk"
        ? ["пн", "вт", "ср", "чт", "пт", "сб", "нд"]
        : language === "en"
          ? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
          : ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
    [language]
  );

  const companyPhoneCountry = useMemo(
    () => inferPhoneCountryFromAddress(business.address) || "Ukraine",
    [business.address]
  );

  useEffect(() => {
    const browserPhoneCountry = getBrowserPhoneCountry();
    setPhoneCountry(browserPhoneCountry || companyPhoneCountry);
  }, [companyPhoneCountry]);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [services, selectedServiceIds]
  );
  const totalDurationMinutes = useMemo(() => getTotalDuration(selectedServices), [selectedServices]);
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, service) => sum + Math.max(0, service.price || 0), 0),
    [selectedServices]
  );
  const primaryService = selectedServices[0] ?? null;
  const combinedServiceName = useMemo(() => getCombinedServiceName(selectedServices), [selectedServices]);

  useEffect(() => {
    if (!primaryService) {
      setSelectedDate("");
      setSelectedTime("");
      return;
    }

    if (selectedDate) {
      return;
    }

    const nextDate = findNextPublicBookingDate({
      config: {
        workSchedule: business.workSchedule,
        customSchedule: business.customSchedule,
        bookingIntervalMinutes: 15,
        services: services.map((service) => ({
          name: service.name,
          durationMinutes: service.durationMinutes ?? 60
        }))
      },
      serviceName: primaryService.name,
      durationMinutesOverride: totalDurationMinutes,
      bookings,
      startDate: getTodayDateKey()
    });

    setSelectedDate(nextDate);
    setVisibleMonth(new Date(`${nextDate}T00:00:00`));
  }, [bookings, business.customSchedule, business.workSchedule, primaryService, selectedDate, services, totalDurationMinutes]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !primaryService) {
      return [];
    }

    return getPublicBookingSlots({
      config: {
        workSchedule: business.workSchedule,
        customSchedule: business.customSchedule,
        bookingIntervalMinutes: 15,
        services: services.map((service) => ({
          name: service.name,
          durationMinutes: service.durationMinutes ?? 60
        }))
      },
      date: selectedDate,
      serviceName: primaryService.name,
      durationMinutesOverride: totalDurationMinutes,
      bookings
    });
  }, [
    bookings,
    business.customSchedule,
    business.workSchedule,
    primaryService,
    selectedDate,
    services,
    totalDurationMinutes
  ]);

  useEffect(() => {
    if (!availableSlots.length) {
      setSelectedTime("");
      return;
    }

    setSelectedTime((current) => (current && availableSlots.includes(current) ? current : availableSlots[0]));
    setTimeError("");
  }, [availableSlots]);

  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const normalizedWorkSchedule = useMemo(() => normalizeWorkSchedule(business.workSchedule), [business.workSchedule]);
  const normalizedCustomSchedule = useMemo(
    () => normalizeCustomSchedule(business.customSchedule),
    [business.customSchedule]
  );
  const availabilityByDate = useMemo(() => {
    const map = new Map<
      string,
      { working: boolean; hasSlots: boolean; label: string }
    >();

    if (!primaryService) {
      return map;
    }

    for (const day of monthDays) {
      const schedule = getDaySchedule(day.key, normalizedWorkSchedule, normalizedCustomSchedule);

      if (!schedule?.enabled) {
        map.set(day.key, { working: false, hasSlots: false, label: t.closedDay });
        continue;
      }

      const slots = getPublicBookingSlots({
        config: {
          workSchedule: business.workSchedule,
          customSchedule: business.customSchedule,
          bookingIntervalMinutes: 15,
          services: services.map((service) => ({
            name: service.name,
            durationMinutes: service.durationMinutes ?? 60
          }))
        },
        date: day.key,
        serviceName: primaryService.name,
        durationMinutesOverride: totalDurationMinutes,
        bookings
      });

      map.set(day.key, {
        working: true,
        hasSlots: slots.length > 0,
        label: slots.length > 0 ? t.availableDay : t.fullDay
      });
    }

    return map;
  }, [
    bookings,
    business.customSchedule,
    business.workSchedule,
    monthDays,
    normalizedCustomSchedule,
    normalizedWorkSchedule,
    primaryService,
    services,
    t.availableDay,
    t.closedDay,
    t.fullDay,
    totalDurationMinutes
  ]);

  const phoneRule = getPhoneRule(phoneCountry);
  const fullPhone = buildInternationalPhone(phoneCountry, localPhone);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) => {
      if (current.includes(serviceId)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((item) => item !== serviceId);
      }

      return [...current, serviceId];
    });
  }

  return (
    <main className="salon-page">
      <section className="salon-shell">
        <section className="salon-hero">
          <div className="salon-hero-copy">
            <p className="eyebrow">{business.categories[0] || t.eyebrow}</p>
            <h1>{business.name}</h1>
            <p className="hero-text">{business.address || t.heroFallback}</p>
            <div className="salon-facts">
              {business.address ? <span>{business.address}</span> : null}
              {business.website ? <span>{business.website}</span> : null}
              {business.allowOnlineBooking ? <span>{t.requestPending}</span> : null}
            </div>
            <img
              src={image}
              alt={business.name}
              style={{
                width: "100%",
                maxWidth: 520,
                borderRadius: 20,
                marginTop: 24,
                objectFit: "cover",
                aspectRatio: "16 / 10"
              }}
            />
          </div>

          <div className="booking-card">
            <h2>{t.bookingTitle}</h2>
            <p className="booking-note">{t.bookingSubtitle}</p>
            {business.allowOnlineBooking ? (
              <form
                action={createBusinessBookingAction}
                className="booking-form"
                onSubmit={(event) => {
                  if (!selectedTime) {
                    event.preventDefault();
                    setTimeError(t.chooseTimeError);
                    return;
                  }

                  if (!isPhoneValid(phoneCountry, localPhone)) {
                    event.preventDefault();
                    setPhoneError(getPhoneErrorText(language, phoneCountry));
                    return;
                  }

                  setPhoneError("");
                  setTimeError("");
                }}
              >
                <input type="hidden" name="businessId" value={business.id} />
                <input type="hidden" name="serviceName" value={combinedServiceName || primaryService?.name || ""} />
                <input type="hidden" name="serviceNamesJson" value={JSON.stringify(selectedServices.map((service) => service.name))} />
                <input type="hidden" name="appointmentDate" value={selectedDate} />
                <input type="hidden" name="appointmentTime" value={selectedTime} />
                <input type="hidden" name="customerPhone" value={fullPhone} />
                <input type="hidden" name="customerPhoneCountry" value={phoneCountry} />
                <input type="hidden" name="customerPhoneLocal" value={localPhone} />
                <input type="hidden" name="returnPath" value={returnPath} />

                <p className="booking-note">{t.requestPendingText}</p>

                <section className="booking-service-summary">
                  <div className="booking-service-summary-head">
                    <strong>{t.servicePickerTitle}</strong>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setServicePickerOpen((value) => !value)}
                    >
                      {selectedServices.length > 0 ? t.addAnotherService : t.chooseService}
                    </button>
                  </div>

                  <div className="booking-selected-services">
                    {selectedServices.map((service) => (
                      <span key={service.id} className="booking-selected-chip">
                        <strong>{service.name}</strong>
                        <small>
                          {service.durationMinutes ?? 60} {t.minuteShort} · {formatMoney(service.price, locale, language)}
                        </small>
                        <button type="button" onClick={() => toggleService(service.id)} aria-label={service.name}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="booking-inline-stats">
                    <span>{t.selectedServices}: {selectedServices.length}</span>
                    <span>{t.totalDuration}: {totalDurationMinutes} {t.minuteShort}</span>
                    <span>{t.totalPrice}: {formatMoney(totalPrice, locale, language)}</span>
                  </div>

                  {servicePickerOpen || selectedServices.length === 0 ? (
                    <div className="booking-service-catalog">
                      {services.map((service) => {
                        const active = selectedServiceIds.includes(service.id);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            className={`booking-service-tile ${active ? "booking-service-tile-active" : ""}`}
                            onClick={() => toggleService(service.id)}
                          >
                            <div>
                              <strong>{service.name}</strong>
                              <span>
                                {service.durationMinutes ?? 60} {t.minuteShort}
                              </span>
                            </div>
                            <strong>{formatMoney(service.price, locale, language)}</strong>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </section>

                <section className="booking-month-card">
                  <div className="booking-calendar-head">
                    <div>
                      <strong>{t.freeDays}</strong>
                      <span>{selectedDate ? formatSelectedDate(selectedDate, locale) : t.noFreeDays}</span>
                    </div>
                    <div className="public-month-head">
                      <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, -1))}>‹</button>
                      <strong>{formatMonthTitle(visibleMonth, locale)}</strong>
                      <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>›</button>
                    </div>
                  </div>

                  <div className="booking-calendar-legend">
                    <span className="booking-day-dot booking-day-dot-available">{t.availableDay}</span>
                    <span className="booking-day-dot booking-day-dot-work">{t.workDay}</span>
                    <span className="booking-day-dot booking-day-dot-full">{t.fullDay}</span>
                    <span className="booking-day-dot booking-day-dot-closed">{t.closedDay}</span>
                  </div>

                  <div className="public-month-weekdays">
                    {weekdays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className="public-month-grid booking-month-grid">
                    {monthDays.map((day) => {
                      const availability = availabilityByDate.get(day.key);
                      const classNames = [
                        !day.inMonth ? "muted" : "",
                        day.key === getTodayDateKey() ? "today" : "",
                        day.key === selectedDate ? "active" : "",
                        availability?.working
                          ? availability.hasSlots
                            ? "booking-day-available"
                            : "booking-day-full"
                          : "booking-day-closed"
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <button
                          key={day.key}
                          type="button"
                          className={classNames}
                          title={availability?.label || t.closedDay}
                          onClick={() => {
                            setSelectedDate(day.key);
                            if (day.date.getMonth() !== visibleMonth.getMonth()) {
                              setVisibleMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                            }
                          }}
                        >
                          {day.day}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="booking-slots-panel">
                  <div className="booking-calendar-headline">
                    <strong>{t.availableSlots}</strong>
                    <span>{selectedDate ? formatSelectedDate(selectedDate, locale) : t.noSlots}</span>
                  </div>

                  <div className="slot-grid">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-button ${selectedTime === slot ? "slot-button-active" : ""}`}
                        onClick={() => {
                          setSelectedTime(slot);
                          setTimeError("");
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  {primaryService && !availableSlots.length ? (
                    <p className="booking-note">{selectedDate ? t.noSlotsForDay : t.noSlots}</p>
                  ) : null}
                  {timeError ? <p className="field-error">{timeError}</p> : null}
                </section>

                <div className="booking-form-grid">
                  <label className="field">
                    <span>{t.name}</span>
                    <input name="customerName" type="text" placeholder={t.namePlaceholder} required />
                  </label>

                  <label className="field">
                    <span>{t.phone}</span>
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
                        placeholder={phoneRule.placeholder}
                        value={localPhone}
                        onChange={(event) => {
                          setLocalPhone(formatPhoneLocal(event.target.value, phoneRule));
                          setPhoneError("");
                        }}
                        onBlur={() => {
                          if (localPhone.trim() && !isPhoneValid(phoneCountry, localPhone)) {
                            setPhoneError(getPhoneErrorText(language, phoneCountry));
                          }
                        }}
                        required
                      />
                    </div>
                  </label>
                </div>

                {phoneError ? <p className="field-error">{phoneError}</p> : null}

                <label className="field">
                  <span>{t.comment}</span>
                  <textarea name="customerNotes" rows={4} placeholder={t.commentPlaceholder} />
                </label>

                <button type="submit" className="primary-button submit-button" disabled={!primaryService || !selectedDate || !selectedTime}>
                  {t.submit}
                </button>
              </form>
            ) : (
              <div className="booking-form">
                <p className="booking-note"><strong>{t.onlineBookingClosed}</strong></p>
                <p className="booking-note">{t.onlineBookingClosedText}</p>
                <a href={getLocalizedPath(language, "/catalog")} className="secondary-button">
                  {t.backToCatalog}
                </a>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
