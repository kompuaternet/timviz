"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalizedSalon, type Salon } from "../../../data/mock-data";
import type { BookingRecord } from "../../../lib/bookings";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneRule,
  getPhoneValidationMessage,
  inferPhoneCountryFromAddress,
  inferPhoneCountryFromLocales,
  isPhoneValid,
  onlyPhoneDigits,
  phoneCountries
} from "../../../lib/phone-format";
import { findNextPublicBookingDate, getPublicBookingSlots } from "../../../lib/public-booking";
import { type SiteLanguage } from "../../../lib/site-language";
import { createBookingAction } from "./actions";
import { useSiteLanguage } from "../../useSiteLanguage";

type SalonViewProps = {
  salon: Salon;
  bookings: BookingRecord[];
  initialLanguage?: SiteLanguage;
};

type SalonCopy = {
  bookingTitle: string;
  date: string;
  name: string;
  phone: string;
  comment: string;
  namePlaceholder: string;
  commentPlaceholder: string;
  submit: string;
  noSlots: string;
  chooseTimeError: string;
};

const salonCopy: Record<SiteLanguage, SalonCopy> = {
  ru: {
    bookingTitle: "Выбери услугу и удобное окно",
    date: "Дата",
    name: "Имя",
    phone: "Телефон",
    comment: "Комментарий",
    namePlaceholder: "Например, Анна",
    commentPlaceholder: "Можно указать пожелания к визиту",
    submit: "Подтвердить запись",
    noSlots: "На выбранную дату свободных окон нет.",
    chooseTimeError: "Выберите время записи."
  },
  uk: {
    bookingTitle: "Оберіть послугу та зручне вікно",
    date: "Дата",
    name: "Ім'я",
    phone: "Телефон",
    comment: "Коментар",
    namePlaceholder: "Наприклад, Анна",
    commentPlaceholder: "Можна вказати побажання до візиту",
    submit: "Підтвердити запис",
    noSlots: "На обрану дату вільних вікон немає.",
    chooseTimeError: "Оберіть час запису."
  },
  en: {
    bookingTitle: "Choose a service and a time slot",
    date: "Date",
    name: "Name",
    phone: "Phone",
    comment: "Comment",
    namePlaceholder: "For example, Anna",
    commentPlaceholder: "Add any notes for the visit",
    submit: "Confirm booking",
    noSlots: "No free slots for the selected date.",
    chooseTimeError: "Choose a booking time."
  }
};

function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

export default function SalonView({ salon, bookings, initialLanguage = "ru" }: SalonViewProps) {
  const language = useSiteLanguage(initialLanguage, true);
  const t = salonCopy[language];
  const localizedSalon = getLocalizedSalon(salon, language);
  const [selectedServiceName, setSelectedServiceName] = useState(salon.services[0]?.name ?? "");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(salon.country || "Ukraine");
  const [localPhone, setLocalPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [timeError, setTimeError] = useState("");

  const companyPhoneCountry = useMemo(
    () => salon.country || inferPhoneCountryFromAddress(salon.address.ru),
    [salon.address.ru, salon.country]
  );
  const activeBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status !== "cancelled")
        .map((booking) => ({
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          serviceName: booking.serviceName
        })),
    [bookings]
  );

  const availableSlots = useMemo(
    () =>
      selectedDate
        ? getPublicBookingSlots({
            config: {
              workSchedule: salon.workSchedule,
              bookingIntervalMinutes: salon.bookingIntervalMinutes,
              services: salon.services.map((service) => ({
                name: service.name,
                durationMinutes: service.durationMinutes
              }))
            },
            date: selectedDate,
            serviceName: selectedServiceName,
            bookings: activeBookings
          })
        : [],
    [activeBookings, salon.bookingIntervalMinutes, salon.services, salon.workSchedule, selectedDate, selectedServiceName]
  );

  useEffect(() => {
    const browserPhoneCountry =
      typeof window === "undefined"
        ? ""
        : inferPhoneCountryFromLocales([window.navigator.language, ...(window.navigator.languages ?? [])]);
    setPhoneCountry(companyPhoneCountry || browserPhoneCountry || "Ukraine");
  }, [companyPhoneCountry]);

  useEffect(() => {
    if (selectedDate) {
      return;
    }

    setSelectedDate(
      findNextPublicBookingDate({
        config: {
          workSchedule: salon.workSchedule,
          bookingIntervalMinutes: salon.bookingIntervalMinutes,
          services: salon.services.map((service) => ({
            name: service.name,
            durationMinutes: service.durationMinutes
          }))
        },
        serviceName: selectedServiceName,
        bookings: activeBookings,
        startDate: getTodayDateKey()
      })
    );
  }, [activeBookings, salon.bookingIntervalMinutes, salon.services, salon.workSchedule, selectedDate, selectedServiceName]);

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
            <p className="eyebrow">{localizedSalon.category}</p>
            <h1>{localizedSalon.name}</h1>
            <p className="hero-text">{localizedSalon.description}</p>

            <div className="salon-facts">
              <span>{localizedSalon.city}</span>
              <span>{localizedSalon.address}</span>
              <span>{localizedSalon.hours}</span>
            </div>
          </div>

          <div className="booking-card">
            <h2>{t.bookingTitle}</h2>
            <form
              action={createBookingAction}
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
              <input type="hidden" name="salonSlug" value={localizedSalon.slug} />
              <input type="hidden" name="serviceName" value={selectedServiceName} />
              <input type="hidden" name="appointmentTime" value={selectedTime} />
              <input type="hidden" name="customerPhone" value={fullPhone} />
              <input type="hidden" name="customerPhoneCountry" value={phoneCountry} />
              <input type="hidden" name="customerPhoneLocal" value={localPhone} />

              <div className="booking-services" role="list" aria-label={t.bookingTitle}>
                {localizedSalon.services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={`booking-row booking-service-button ${selectedServiceName === service.bookingName ? "booking-service-active" : ""}`}
                    onClick={() => setSelectedServiceName(service.bookingName)}
                  >
                    <div>
                      <strong>{service.name}</strong>
                      <span>{service.duration}</span>
                    </div>
                    <strong>{service.price}</strong>
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
                  <input
                    name="customerName"
                    type="text"
                    placeholder={t.namePlaceholder}
                    required
                  />
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
                      id="customer-phone-local"
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
                <textarea
                  name="customerNotes"
                  rows={4}
                  placeholder={t.commentPlaceholder}
                />
              </label>

              <button type="submit" className="primary-button submit-button">
                {t.submit}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
