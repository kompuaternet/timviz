"use client";

import * as Sentry from "@sentry/nextjs";

type BookingBreadcrumbData = {
  language?: string;
  businessId?: string;
  serviceId?: string;
  serviceIds?: string[];
  specialistId?: string;
  dateSelected?: boolean;
  timeSelected?: boolean;
  step?: string;
};

export function addBookingBreadcrumb(message: string, data: BookingBreadcrumbData = {}) {
  Sentry.addBreadcrumb({
    category: "booking",
    level: "info",
    message,
    data
  });
}
