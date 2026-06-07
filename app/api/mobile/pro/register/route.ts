import { NextResponse } from "next/server";
import { getClientIp, verifyCaptchaToken } from "../../../../../lib/auth-security";
import { authApiCopy, normalizeAuthLanguage } from "../../../../../lib/auth-api-i18n";
import { reportMobileRegistrationConversion } from "../../../../../lib/mobile-registration-conversions";
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

const emailAlreadyRegisteredCopy = {
  ru: "Этот email уже зарегистрирован. Войдите в аккаунт или восстановите пароль.",
  uk: "Цей email уже зареєстрований. Увійдіть в акаунт або відновіть пароль.",
  en: "This email is already registered. Sign in or reset your password.",
  fr: "Cet email est déjà enregistré. Connectez-vous ou réinitialisez le mot de passe.",
  pl: "Ten email jest już zarejestrowany. Zaloguj się albo zresetuj hasło.",
  cs: "Tento e-mail je již zaregistrován. Přihlaste se nebo obnovte heslo.",
  es: "Este email ya está registrado. Inicia sesión o restablece la contraseña.",
  de: "Diese E-Mail ist bereits registriert. Melde dich an oder setze das Passwort zurück."
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
  let language = normalizeAuthLanguage(undefined);

  try {
    const body = await request.json();
    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const email = cleanText(body.email).toLowerCase();
    const password = String(body.password ?? "");
    const phone = cleanText(body.phone);
    const companyName = cleanText(body.companyName);
    language = normalizeAuthLanguage(body.language);
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
        isNewRegistration: false,
        workspaceReady: true,
        joinRequest: null,
        token: signSessionValue(existingProfile.id),
        profile: {
          id: existingProfile.id,
          email: profile?.email || email,
          displayName,
          language: profile?.language || language
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

    await reportMobileRegistrationConversion({
      professionalId: result.professionalId,
      provider: "email",
      email,
      phone,
      displayName,
      businessName: companyName,
      registrationSource,
      workspaceReady: result.workspaceReady,
      language,
      country,
      currency,
      request
    });

    return NextResponse.json({
      ...result,
      isNewRegistration: true,
      token: signSessionValue(result.professionalId),
      profile: {
        id: result.professionalId,
        email: profile?.email || email,
        displayName,
        language: profile?.language || language
      }
    });
  } catch (error) {
    console.error("[mobile-pro-register] Registration failed", error);
    const message = error instanceof Error ? error.message : "";
    if (/email.*существует|already exists|duplicate key|professionals_email/i.test(message)) {
      return NextResponse.json({ error: emailAlreadyRegisteredCopy[language] }, { status: 409 });
    }

    return NextResponse.json({ error: authApiCopy[language].registrationFailed }, { status: 400 });
  }
}
