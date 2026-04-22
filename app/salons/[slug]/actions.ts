"use server";

import { redirect } from "next/navigation";
import { createBooking } from "../../../lib/bookings";
import { buildInternationalPhone, isPhoneValid } from "../../../lib/phone-format";

export async function createBookingAction(formData: FormData) {
  const phoneCountry = String(formData.get("customerPhoneCountry") ?? "");
  const phoneLocal = String(formData.get("customerPhoneLocal") ?? "");
  const customerPhone =
    phoneLocal.trim() && phoneCountry.trim()
      ? buildInternationalPhone(phoneCountry, phoneLocal)
      : String(formData.get("customerPhone") ?? "");

  if (phoneLocal.trim() && phoneCountry.trim() && !isPhoneValid(phoneCountry, phoneLocal)) {
    throw new Error("Customer phone is invalid.");
  }

  const booking = await createBooking({
    salonSlug: String(formData.get("salonSlug") ?? ""),
    serviceName: String(formData.get("serviceName") ?? ""),
    appointmentDate: String(formData.get("appointmentDate") ?? ""),
    appointmentTime: String(formData.get("appointmentTime") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone,
    customerNotes: String(formData.get("customerNotes") ?? "")
  });

  redirect(`/booking-success/${booking.id}`);
}
