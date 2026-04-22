import { notFound } from "next/navigation";
import { getSalonBySlug } from "../../../data/mock-data";
import { getAllBookings } from "../../../lib/bookings";
import SalonView from "./SalonView";

export const dynamic = "force-dynamic";

type SalonPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SalonPage({ params }: SalonPageProps) {
  const { slug } = await params;
  const salon = getSalonBySlug(slug);

  if (!salon) {
    notFound();
  }

  const bookings = (await getAllBookings()).filter((booking) => booking.salonSlug === slug);

  return <SalonView salon={salon} bookings={bookings} />;
}
