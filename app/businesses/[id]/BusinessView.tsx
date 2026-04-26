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
import { getLocalizedPath, type SiteLanguage } from "../../../lib/site-language";
import { createBusinessBookingAction } from "./actions";
import { useSiteLanguage } from "../../useSiteLanguage";

type BusinessViewProps = {
  business: BusinessRecord;
  services: ServiceRecord[];
  bookings: {
    appointmentDate: string;
    appointmentTime: string;
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
  onlineBookingClosed: string;
  onlineBookingClosedText: string;
  requestPending: string;
  requestPendingText: string;
  date: string;
  name: string;
  phone: string;
  comment: string;
  namePlaceholder: string;
  commentPlaceholder: string;
  submit: string;
  noSlots: string;
  chooseTimeError: string;
  backToCatalog: string;
};

const businessCopy: Record<SiteLanguage, BusinessCopy> = {
  ru: {
    eyebrow: "Онлайн-запись",
    heroFallback: "Запись на услуги компании",
    bookingTitle: "Выберите услугу и удобное окно",
    onlineBookingClosed: "Онлайн-запись выключена",
    onlineBookingClosedText: "Владелец бизнеса пока не принимает записи с сайта. Карточка компании остаётся доступной для просмотра.",
    requestPending: "Заявка на запись",
    requestPendingText: "После отправки заявка появится в календаре владельца и будет ждать подтверждения.",
    date: "Дата",
    name: "Имя",
    phone: "Телефон",
    comment: "Комментарий",
    namePlaceholder: "Например, Анна",
    commentPlaceholder: "Можно указать пожелания к визиту",
    submit: "Отправить заявку",
    noSlots: "На выбранную дату свободных окон нет.",
    chooseTimeError: "Выберите время записи.",
    backToCatalog: "Вернуться в каталог"
  },
  uk: {
    eyebrow: "Онлайн-запис",
    heroFallback: "Запис на послуги компанії",
    bookingTitle: "Оберіть послугу та зручне вікно",
    onlineBookingClosed: "Онлайн-запис вимкнено",
    onlineBookingClosedText: "Власник бізнесу поки що не приймає записи із сайту. Картка компанії лишається доступною для перегляду.",
    requestPending: "Заявка на запис",
    requestPendingText: "Після відправлення заявка з’явиться в календарі власника й чекатиме на підтвердження.",
    date: "Дата",
    name: "Ім'я",
    phone: "Телефон",
    comment: "Коментар",
    namePlaceholder: "Наприклад, Анна",
    commentPlaceholder: "Можна вказати побажання до візиту",
    submit: "Надіслати заявку",
    noSlots: "На обрану дату вільних вікон немає.",
    chooseTimeError: "Оберіть час запису.",
    backToCatalog: "Повернутися в каталог"
  },
  en: {
    eyebrow: "Online booking",
    heroFallback: "Business service booking",
    bookingTitle: "Choose a service and a time slot",
    onlineBookingClosed: "Online booking is turned off",
    onlineBookingClosedText: "The business owner does not accept bookings from the public site yet. The business page is still available for viewing.",
    requestPending: "Booking request",
    requestPendingText: "After you send it, the request appears in the owner's calendar and waits for confirmation.",
    date: "Date",
    name: "Name",
    phone: "Phone",
    comment: "Comment",
    namePlaceholder: "For example, Anna",
    commentPlaceholder: "Add any notes for the visit",
    submit: "Send request",
    noSlots: "No free slots for the selected date.",
    chooseTimeError: "Choose a booking time.",
    backToCatalog: "Back to catalog"
  }
};

function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
  const [selectedServiceName, setSelectedServiceName] = useState(services[0]?.name ?? "");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("Ukraine");
  const [localPhone, setLocalPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [timeError, setTimeError] = useState("");
  const companyPhoneCountry = useMemo(
    () => inferPhoneCountryFromAddress(business.address) || "Ukraine",
    [business.address]
  );

  useEffect(() => {
    const browserPhoneCountry = getBrowserPhoneCountry();
    setPhoneCountry(browserPhoneCountry || companyPhoneCountry);
  }, [companyPhoneCountry]);

  const availableSlots = useMemo(
    () =>
      selectedDate && selectedServiceName
        ? getPublicBookingSlots({
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
            serviceName: selectedServiceName,
            bookings
          })
        : [],
    [bookings, business.customSchedule, business.workSchedule, selectedDate, selectedServiceName, services]
  );

  useEffect(() => {
    if (selectedDate || services.length === 0) {
      return;
    }

    setSelectedDate(
      findNextPublicBookingDate({
        config: {
          workSchedule: business.workSchedule,
          customSchedule: business.customSchedule,
          bookingIntervalMinutes: 15,
          services: services.map((service) => ({
            name: service.name,
            durationMinutes: service.durationMinutes ?? 60
          }))
        },
        serviceName: services[0]?.name ?? "",
        bookings,
        startDate: getTodayDateKey()
      })
    );
  }, [bookings, business.customSchedule, business.workSchedule, selectedDate, services]);

  useEffect(() => {
    if (!availableSlots.length) {
      setSelectedTime("");
      return;
    }

    setSelectedTime((current) => (current && availableSlots.includes(current) ? current : availableSlots[0]));
    setTimeError("");
  }, [availableSlots]);

  const phoneRule = getPhoneRule(phoneCountry);
  const fullPhone = buildInternationalPhone(phoneCountry, localPhone);

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
              style={{ width: "100%", maxWidth: 520, borderRadius: 20, marginTop: 24, objectFit: "cover", aspectRatio: "16 / 10" }}
            />
          </div>

          <div className="booking-card">
            <h2>{t.bookingTitle}</h2>
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
                <input type="hidden" name="serviceName" value={selectedServiceName} />
                <input type="hidden" name="appointmentTime" value={selectedTime} />
                <input type="hidden" name="customerPhone" value={fullPhone} />
                <input type="hidden" name="customerPhoneCountry" value={phoneCountry} />
                <input type="hidden" name="customerPhoneLocal" value={localPhone} />
                <input type="hidden" name="returnPath" value={returnPath} />

                <p className="booking-note">{t.requestPendingText}</p>

                <div className="booking-services" role="list" aria-label={t.bookingTitle}>
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      className={`booking-row booking-service-button ${selectedServiceName === service.name ? "booking-service-active" : ""}`}
                      onClick={() => setSelectedServiceName(service.name)}
                    >
                      <div>
                        <strong>{service.name}</strong>
                        <span>{`${service.durationMinutes ?? 60} мин`}</span>
                      </div>
                      <strong>{`${service.price} ${language === "en" ? "" : "грн"}`.trim()}</strong>
                    </button>
                  ))}
                </div>

                <label className="field">
                  <span>{t.date}</span>
                  <input
                    name="appointmentDate"
                    type="date"
                    min={getTodayDateKey()}
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    required
                  />
                </label>

                <div className="slot-grid" role="list" aria-label="Available slots">
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

                {!availableSlots.length ? <p className="booking-note">{t.noSlots}</p> : null}
                {timeError ? <p className="field-error">{timeError}</p> : null}

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

                <button type="submit" className="primary-button submit-button">
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
