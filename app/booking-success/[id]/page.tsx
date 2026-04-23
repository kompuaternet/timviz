import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingById } from "../../../lib/bookings";
import { buildMetadata } from "../../../lib/seo";
import BookingSuccessView from "./BookingSuccessView";

type BookingSuccessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = buildMetadata(
  "/booking-success",
  {
    title: "Подтверждение записи",
    description: "Страница подтверждения записи Timviz."
  },
  "ru",
  { noIndex: true }
);

export default async function BookingSuccessPage({
  params
}: BookingSuccessPageProps) {
  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) {
    notFound();
  }

  return <BookingSuccessView booking={booking} />;
}
