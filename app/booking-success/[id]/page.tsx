import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingById } from "../../../lib/bookings";
import { buildMetadata } from "../../../lib/seo";
import BookingSuccessView from "./BookingSuccessView";

type BookingSuccessPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  params,
  searchParams
}: BookingSuccessPageProps) {
  const { id } = await params;
  const paramsMap = (await searchParams) ?? {};
  const booking = await getBookingById(id);

  if (!booking) {
    notFound();
  }

  const back = Array.isArray(paramsMap.back) ? paramsMap.back[0] : paramsMap.back;
  const pending = Array.isArray(paramsMap.pending) ? paramsMap.pending[0] : paramsMap.pending;

  return <BookingSuccessView booking={booking} backPath={back} pending={pending === "1" || booking.status === "pending"} />;
}
