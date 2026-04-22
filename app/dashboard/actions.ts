"use server";

import { redirect } from "next/navigation";
import { updateBookingStatus } from "../../lib/bookings";
import type { BookingStatus } from "../../lib/bookings";

export async function updateBookingStatusAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  const salon = String(formData.get("salon") ?? "");
  const date = String(formData.get("date") ?? "");

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!["confirmed", "completed", "cancelled"].includes(status)) {
    throw new Error("Invalid booking status.");
  }

  await updateBookingStatus(bookingId, status);

  const params = new URLSearchParams();

  if (salon) {
    params.set("salon", salon);
  }

  if (date) {
    params.set("date", date);
  }

  const search = params.toString();
  redirect(search ? `/dashboard?${search}` : "/dashboard");
}
