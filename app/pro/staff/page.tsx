import { redirect } from "next/navigation";

type ProStaffPageProps = {
  searchParams?: Promise<{
    openAdd?: string;
  }>;
};

export default async function ProStaffPage({ searchParams }: ProStaffPageProps) {
  const params = (await searchParams) ?? {};
  if (params.openAdd === "1") {
    redirect("/pro/staff/members?openAdd=1");
  }

  redirect("/pro/staff/schedule");
}
