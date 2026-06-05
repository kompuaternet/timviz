import { NextResponse } from "next/server";
import { getClientIp, verifyCaptchaToken } from "../../../../../lib/auth-security";
import { authApiCopy, normalizeAuthLanguage } from "../../../../../lib/auth-api-i18n";
import { signSessionValue } from "../../../../../lib/pro-auth";
import {
  activateProfessionalEmailByEmail,
  createProfessionalSetup,
  getProfessionalProfileByEmail,
  getProfessionalProfileById,
  updateProfessionalPasswordByEmail
} from "../../../../../lib/pro-data";
import { sendSuperadminTelegramNotification } from "../../../../../lib/telegram-bot";

const defaultServiceMode = "Клиенты приходят в мое физическое заведение";
const passwordTooShortCopy = {
  ru: "Пароль должен содержать минимум 6 символов.",
  uk: "Пароль має містити мінімум 6 символів.",
  en: "Password must contain at least 6 characters.",
  fr: "Le mot de passe doit contenir au moins 6 caractères.",
  pl: "Hasło musi zawierać co najmniej 6 znaków.",
  cs: "Heslo musí obsahovat alespoň 6 znaků.",
  es: "La contraseña debe tener al menos 6 caracteres.",
  de: "Das Passwort muss mindestens 6 Zeichen enthalten."
} as const;

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function getMobileRegistrationSource(body: Record<string, unknown>, request: Request) {
  const rawSource = cleanText(body.signupSource || body.source || body.platform).toLowerCase();
  const userAgent = cleanText(request.headers.get("user-agent")).toLowerCase();
  const source = rawSource || userAgent;

  if (source.includes("ios") || source.includes("iphone") || source.includes("ipad")) {
    return "мобильное приложение Apple";
  }

  if (source.includes("android")) {
    return "мобильное приложение Android";
  }

  return "мобильное приложение";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const email = cleanText(body.email).toLowerCase();
    const password = String(body.password ?? "");
    const phone = cleanText(body.phone);
    const companyName = cleanText(body.companyName);
    const language = normalizeAuthLanguage(body.language);
    const t = authApiCopy[language];
    const country = cleanText(body.country) || "Ukraine";
    const timezone = cleanText(body.timezone) || "Europe/Kyiv";
    const currency = cleanText(body.currency) || "UAH";
    const registrationSource = getMobileRegistrationSource(body, request);

    if (!firstName || !email || !password || !phone || !companyName) {
      return NextResponse.json({ error: t.registrationMissing }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: passwordTooShortCopy[language] }, { status: 400 });
    }

    const captchaOk = await verifyCaptchaToken(body.captchaToken, getClientIp(request));
    if (!captchaOk) {
      return NextResponse.json({ error: t.captchaRequired }, { status: 400 });
    }

    const existingProfile = await getProfessionalProfileByEmail(email);
    if (existingProfile?.id && existingProfile.accountStatus === "pending_email") {
      await updateProfessionalPasswordByEmail(email, password);
      await activateProfessionalEmailByEmail(email);
      const profile = await getProfessionalProfileById(existingProfile.id);
      const displayName =
        `${profile?.firstName || firstName} ${profile?.lastName || lastName}`.trim() || email;

      return NextResponse.json({
        professionalId: existingProfile.id,
        workspaceReady: true,
        joinRequest: null,
        token: signSessionValue(existingProfile.id),
        profile: {
          id: existingProfile.id,
          email: profile?.email || email,
          displayName
        }
      });
    }

    const result = await createProfessionalSetup({
      account: {
        firstName,
        lastName,
        email,
        password,
        authProvider: "email",
        emailConfirmed: true,
        phone,
        country,
        timezone,
        language,
        currency
      },
      setup: {
        ownerMode: "owner",
        joinBusinessId: "",
        joinBusinessName: "",
        joinBusinessRole: "",
        companyName,
        website: "",
        categories: [],
        services: [],
        accountType: "solo",
        serviceMode: defaultServiceMode,
        address: "",
        addressDetails: "",
        addressLat: null,
        addressLon: null
      }
    });

    const profile = await getProfessionalProfileById(result.professionalId);
    const displayName =
      `${profile?.firstName || firstName} ${profile?.lastName || lastName}`.trim() || email;

    await sendSuperadminTelegramNotification({
      eventType: "user_registered",
      professionalId: result.professionalId,
      professionalName: displayName,
      professionalEmail: email,
      professionalPhone: phone,
      registrationSource,
      ownerMode: "owner",
      businessName: companyName || undefined,
      workspaceReady: result.workspaceReady
    }).catch(() => undefined);

    return NextResponse.json({
      ...result,
      token: signSessionValue(result.professionalId),
      profile: {
        id: result.professionalId,
        email: profile?.email || email,
        displayName
      }
    });
  } catch (error) {
    console.error("[mobile-pro-register] Registration failed", error);
    return NextResponse.json({ error: authApiCopy.en.registrationFailed }, { status: 400 });
  }
}
