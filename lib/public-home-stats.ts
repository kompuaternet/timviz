import { promises as fs } from "fs";
import path from "path";
import { getPublicCalendarAppointments } from "./pro-calendar";
import { getBusinessDirectorySnapshot } from "./pro-data";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type PublicHomeStats = {
  bookedToday: number;
  totalBookings: number;
  partnerBusinesses: number;
  countries: number;
  professionals: number;
  totalUsers: number;
};

const BOOKED_TODAY_BASE = 328;
const TOTAL_BOOKINGS_BASE = 1000;
const customerAccountsStorePath = path.join(process.cwd(), "data", "customer-accounts.json");
const HOME_STATS_TIMEZONE = process.env.PUBLIC_HOME_STATS_TIMEZONE || "Europe/Kyiv";

function getDateKeyInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function isCustomerAccountsTableMissing(message?: string) {
  return typeof message === "string" && /customer_accounts/i.test(message);
}

async function getLocalCustomerAccountsCount() {
  try {
    const file = await fs.readFile(customerAccountsStorePath, "utf8");
    const parsed = JSON.parse(file) as { accounts?: unknown[] };
    return Array.isArray(parsed.accounts) ? parsed.accounts.length : 0;
  } catch {
    return 0;
  }
}

async function getCustomerAccountsCount() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { count, error } = await supabase
        .from("customer_accounts")
        .select("email", { count: "exact", head: true });

      if (!error && typeof count === "number") {
        return Math.max(0, count);
      }

      if (error && !isCustomerAccountsTableMissing(error.message)) {
        throw new Error(error.message);
      }
    }
  }

  return getLocalCustomerAccountsCount();
}

export async function getPublicHomeStats(): Promise<PublicHomeStats> {
  const [appointments, directory, customerAccountsCount] = await Promise.all([
    getPublicCalendarAppointments(),
    getBusinessDirectorySnapshot(),
    getCustomerAccountsCount()
  ]);

  const activeAppointments = appointments.filter((appointment) => appointment.kind === "appointment");
  const todayDateKey = getDateKeyInTimezone(new Date(), HOME_STATS_TIMEZONE);
  const todayBookingsCount = activeAppointments.filter(
    (appointment) => appointment.appointmentDate === todayDateKey
  ).length;
  const professionalsCount = directory.professionals.filter(
    (professional) => professional.accountStatus !== "placeholder"
  ).length;
  const countriesCount = new Set(
    directory.professionals
      .map((professional) => professional.country?.trim().toLowerCase())
      .filter((country): country is string => Boolean(country))
  ).size;

  return {
    bookedToday: BOOKED_TODAY_BASE + todayBookingsCount,
    totalBookings: TOTAL_BOOKINGS_BASE + activeAppointments.length,
    partnerBusinesses: directory.businesses.length,
    countries: countriesCount,
    professionals: professionalsCount,
    totalUsers: professionalsCount + customerAccountsCount
  };
}

