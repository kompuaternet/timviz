import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCustomerDashboard,
  upsertCustomerAccount,
  type CustomerAddress,
  type CustomerNotifications
} from "../../../../lib/customer-account";
import {
  getPublicCustomerCookieName,
  verifyPublicCustomerSession
} from "../../../../lib/public-customer-auth";

function sanitizeAddresses(value: unknown): CustomerAddress[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const source = item as Partial<CustomerAddress>;
      const title = typeof source.title === "string" ? source.title.trim() : "";
      const address = typeof source.address === "string" ? source.address.trim() : "";
      if (!title && !address) {
        return null;
      }

      return {
        id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : `addr_${crypto.randomUUID()}`,
        label: typeof source.label === "string" ? source.label.trim() : "other",
        title,
        address
      } satisfies CustomerAddress;
    })
    .filter((item): item is CustomerAddress => Boolean(item));
}

function sanitizeNotifications(value: unknown): CustomerNotifications {
  const source = value && typeof value === "object" ? (value as Partial<CustomerNotifications>) : {};
  return {
    bookingSms: source.bookingSms === true,
    bookingWhatsapp: source.bookingWhatsapp === true,
    marketingEmail: source.marketingEmail === true,
    marketingSms: source.marketingSms === true,
    marketingWhatsapp: source.marketingWhatsapp === true
  };
}

async function getSession() {
  const cookieStore = await cookies();
  return verifyPublicCustomerSession(cookieStore.get(getPublicCustomerCookieName())?.value);
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dashboard = await getCustomerDashboard(session);
  return NextResponse.json(dashboard);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    givenName?: string;
    familyName?: string;
    fullName?: string;
    phone?: string;
    birthday?: string;
    gender?: string;
    addresses?: unknown;
    notifications?: unknown;
  };

  const givenName = typeof body.givenName === "string" ? body.givenName.trim() : "";
  const familyName = typeof body.familyName === "string" ? body.familyName.trim() : "";
  const fullName =
    typeof body.fullName === "string" && body.fullName.trim()
      ? body.fullName.trim()
      : `${givenName} ${familyName}`.trim();

  const account = await upsertCustomerAccount(session, {
    givenName,
    familyName,
    fullName,
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    birthday: typeof body.birthday === "string" ? body.birthday.trim() : "",
    gender: typeof body.gender === "string" ? body.gender.trim() : "",
    addresses: sanitizeAddresses(body.addresses),
    notifications: sanitizeNotifications(body.notifications)
  });

  return NextResponse.json({ account });
}
