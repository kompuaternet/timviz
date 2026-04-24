import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSuperadminSessionCookieName,
  getSuperadminSetupMessage,
  isSuperadminConfigured,
  verifySuperadminSession
} from "../../../lib/admin-auth";
import SuperadminLoginForm from "./SuperadminLoginForm";

export default async function SuperadminLoginPage() {
  const cookieStore = await cookies();
  const session = verifySuperadminSession(
    cookieStore.get(getSuperadminSessionCookieName())?.value
  );

  if (session) {
    redirect("/superadmin");
  }

  return (
    <SuperadminLoginForm
      setupMessage={isSuperadminConfigured() ? "" : getSuperadminSetupMessage()}
    />
  );
}
