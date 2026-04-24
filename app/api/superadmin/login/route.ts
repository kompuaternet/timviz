import { NextResponse } from "next/server";
import {
  buildAdminLoginThrottleKey,
  clearAdminLoginFailures,
  getAdminLoginLock,
  registerAdminLoginFailure
} from "../../../../lib/admin-login-rate-limit";
import {
  getSuperadminSessionCookieName,
  isSuperadminConfigured,
  signSuperadminSession,
  verifySuperadminCredentials
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  try {
    if (!isSuperadminConfigured()) {
      return NextResponse.json(
        { error: "Суперадмин ещё не настроен в переменных окружения." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const email = String(body.email || "");
    const password = String(body.password || "");
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const throttleKey = buildAdminLoginThrottleKey(email, ip);
    const lock = getAdminLoginLock(throttleKey);

    if (lock.isLocked) {
      return NextResponse.json(
        {
          error: `Слишком много неверных попыток. Повторите через ${lock.remainingMinutes} мин.`,
          retryAfterSeconds: lock.remainingSeconds
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(lock.remainingSeconds)
          }
        }
      );
    }

    if (!verifySuperadminCredentials(email, password)) {
      const failure = registerAdminLoginFailure(throttleKey);
      if (failure.isLocked) {
        return NextResponse.json(
          {
            error: "Слишком много неверных попыток. Вход заблокирован на 3 минуты.",
            retryAfterSeconds: Math.ceil(failure.lockoutMs / 1000)
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(failure.lockoutMs / 1000))
            }
          }
        );
      }

      return NextResponse.json(
        {
          error: `Неверный логин или пароль. Осталось попыток: ${Math.max(0, 3 - failure.failedAttempts)}`
        },
        { status: 401 }
      );
    }

    clearAdminLoginFailures(throttleKey);

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: getSuperadminSessionCookieName(),
      value: signSuperadminSession(email),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось выполнить вход." },
      { status: 400 }
    );
  }
}
