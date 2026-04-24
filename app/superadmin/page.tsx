import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSuperadminCatalogItems,
  getSuperadminPhotos,
  getSuperadminServices,
  getSuperadminUsers
} from "../../lib/admin-data";
import { getSuperadminSessionCookieName, verifySuperadminSession } from "../../lib/admin-auth";
import SuperadminView from "./SuperadminView";

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const adminEmail = verifySuperadminSession(
    cookieStore.get(getSuperadminSessionCookieName())?.value
  );

  if (!adminEmail) {
    redirect("/superadmin/login");
  }

  const [initialUsers, initialServices, initialPhotos, initialCatalog] = await Promise.all([
    getSuperadminUsers(),
    getSuperadminServices(),
    getSuperadminPhotos(),
    getSuperadminCatalogItems()
  ]);

  return (
    <SuperadminView
      adminEmail={adminEmail}
      initialUsers={initialUsers}
      initialServices={initialServices}
      initialPhotos={initialPhotos}
      initialCatalog={initialCatalog}
    />
  );
}
