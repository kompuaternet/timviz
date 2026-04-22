import { notFound } from "next/navigation";
import { getBookingById } from "../../../lib/bookings";
import BookingSuccessView from "./BookingSuccessView";

type BookingSuccessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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
