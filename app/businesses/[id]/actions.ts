"use server";

import { redirect } from "next/navigation";
import { buildInternationalPhone, isPhoneValid } from "../../../lib/phone-format";
import { createBusinessBooking } from "../../../lib/bookings";

export async function createBusinessBookingAction(formData: FormData) {
  const phoneCountry = String(formData.get("customerPhoneCountry") ?? "");
  const phoneLocal = String(formData.get("customerPhoneLocal") ?? "");
  const customerPhone =
    phoneLocal.trim() && phoneCountry.trim()
      ? buildInternationalPhone(phoneCountry, phoneLocal)
      : String(formData.get("customerPhone") ?? "");

  if (phoneLocal.trim() && phoneCountry.trim() && !isPhoneValid(phoneCountry, phoneLocal)) {
    throw new Error("Customer phone is invalid.");
  }

  const booking = await createBusinessBooking({
    businessId: String(formData.get("businessId") ?? ""),
    serviceName: String(formData.get("serviceName") ?? ""),
    appointmentDate: String(formData.get("appointmentDate") ?? ""),
    appointmentTime: String(formData.get("appointmentTime") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone,
    customerNotes: String(formData.get("customerNotes") ?? "")
  });

  const back = String(formData.get("returnPath") ?? "/catalog");
  redirect(`/booking-success/${booking.id}?back=${encodeURIComponent(back)}&pending=1`);
}
