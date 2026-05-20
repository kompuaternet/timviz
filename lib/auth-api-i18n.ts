export type AuthLanguage = "ru" | "uk" | "en" | "fr" | "pl" | "cs" | "es" | "de";

export function normalizeAuthLanguage(value: unknown): AuthLanguage {
  const language = String(value ?? "").trim().toLowerCase();
  if (language === "ua" || language.startsWith("uk") || language.startsWith("ук")) return "uk";
  if (language.startsWith("en") || language.startsWith("анг")) return "en";
  if (language.startsWith("fr")) return "fr";
  if (language.startsWith("pl")) return "pl";
  if (language.startsWith("cs") || language.startsWith("cz")) return "cs";
  if (language.startsWith("es")) return "es";
  if (language.startsWith("de")) return "de";
  return "en";
}

export const authApiCopy: Record<
  AuthLanguage,
  {
    accountBlocked: string;
    captchaRequired: string;
    disposableEmail: string;
    emailInvalid: string;
    emailNotConfirmed: string;
    forgotFailed: string;
    forgotResponse: string;
    invalidLogin: string;
    loginFailed: string;
    loginMissing: string;
    passwordMissingToken: string;
    passwordResetFailed: string;
    passwordResetInvalid: string;
    passwordResetNotFound: string;
    passwordResetWeak: string;
    rateLimit: string;
    registrationFailed: string;
    registrationMissing: string;
    resendResponse: string;
    resendWait: string;
    smtpUnavailable: string;
  }
> = {
  ru: {
    accountBlocked: "Аккаунт заблокирован.",
    captchaRequired: "Подтвердите, что вы не робот.",
    disposableEmail: "Используйте настоящую email-адресу.",
    emailInvalid: "Укажите корректный email.",
    emailNotConfirmed: "Подтвердите email, чтобы войти в кабинет.",
    forgotFailed: "Не удалось отправить письмо восстановления.",
    forgotResponse: "Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля.",
    invalidLogin: "Неверный email или пароль.",
    loginFailed: "Не удалось войти.",
    loginMissing: "Введите email и пароль.",
    passwordMissingToken: "Ссылка восстановления неполная.",
    passwordResetFailed: "Не удалось обновить пароль.",
    passwordResetInvalid: "Ссылка восстановления недействительна или устарела.",
    passwordResetNotFound: "Аккаунт не найден.",
    passwordResetWeak: "Пароль: минимум 8 символов, буква и цифра.",
    rateLimit: "Слишком много попыток. Попробуйте немного позже.",
    registrationFailed: "Не удалось создать аккаунт.",
    registrationMissing: "Заполните обязательные поля.",
    resendResponse: "Если аккаунт ожидает подтверждения, мы отправили письмо ещё раз.",
    resendWait: "Отправить ещё раз можно через 60 секунд.",
    smtpUnavailable: "Восстановление пароля временно недоступно. Попробуйте чуть позже."
  },
  uk: {
    accountBlocked: "Акаунт заблоковано.",
    captchaRequired: "Підтвердіть, що ви не робот.",
    disposableEmail: "Використайте справжню email-адресу.",
    emailInvalid: "Вкажіть коректний email.",
    emailNotConfirmed: "Підтвердіть email, щоб увійти в кабінет.",
    forgotFailed: "Не вдалося надіслати лист відновлення.",
    forgotResponse: "Якщо акаунт з таким email існує, ми надіслали посилання для відновлення пароля.",
    invalidLogin: "Невірний email або пароль.",
    loginFailed: "Не вдалося увійти.",
    loginMissing: "Введіть email і пароль.",
    passwordMissingToken: "Посилання відновлення неповне.",
    passwordResetFailed: "Не вдалося оновити пароль.",
    passwordResetInvalid: "Посилання відновлення недійсне або застаріле.",
    passwordResetNotFound: "Акаунт не знайдено.",
    passwordResetWeak: "Пароль: мінімум 8 символів, літера і цифра.",
    rateLimit: "Забагато спроб. Спробуйте трохи пізніше.",
    registrationFailed: "Не вдалося створити акаунт.",
    registrationMissing: "Заповніть обов'язкові поля.",
    resendResponse: "Якщо акаунт очікує підтвердження, ми надіслали лист ще раз.",
    resendWait: "Надіслати ще раз можна через 60 секунд.",
    smtpUnavailable: "Відновлення пароля тимчасово недоступне. Спробуйте трохи пізніше."
  },
  en: {
    accountBlocked: "Account is blocked.",
    captchaRequired: "Confirm that you are not a robot.",
    disposableEmail: "Use a real email address.",
    emailInvalid: "Enter a valid email.",
    emailNotConfirmed: "Confirm your email to enter the workspace.",
    forgotFailed: "Could not send the reset email.",
    forgotResponse: "If an account with this email exists, we sent a password reset link.",
    invalidLogin: "Invalid email or password.",
    loginFailed: "Could not sign in.",
    loginMissing: "Enter email and password.",
    passwordMissingToken: "The reset link is incomplete.",
    passwordResetFailed: "Could not update the password.",
    passwordResetInvalid: "The reset link is invalid or expired.",
    passwordResetNotFound: "Account not found.",
    passwordResetWeak: "Password: at least 8 characters, one letter and one digit.",
    rateLimit: "Too many attempts. Try again a little later.",
    registrationFailed: "Could not create the account.",
    registrationMissing: "Fill in the required fields.",
    resendResponse: "If the account is waiting for confirmation, we sent the email again.",
    resendWait: "You can send again in 60 seconds.",
    smtpUnavailable: "Password recovery is temporarily unavailable. Try again a little later."
  },
  fr: {
    accountBlocked: "Le compte est bloqué.",
    captchaRequired: "Confirmez que vous n'êtes pas un robot.",
    disposableEmail: "Utilisez une vraie adresse email.",
    emailInvalid: "Saisissez un email valide.",
    emailNotConfirmed: "Confirmez votre email pour accéder à l'espace de travail.",
    forgotFailed: "Impossible d'envoyer l'email de réinitialisation.",
    forgotResponse: "Si un compte existe avec cet email, nous avons envoyé un lien de réinitialisation.",
    invalidLogin: "Email ou mot de passe incorrect.",
    loginFailed: "Connexion impossible.",
    loginMissing: "Saisissez l'email et le mot de passe.",
    passwordMissingToken: "Le lien de réinitialisation est incomplet.",
    passwordResetFailed: "Impossible de mettre à jour le mot de passe.",
    passwordResetInvalid: "Le lien de réinitialisation est invalide ou expiré.",
    passwordResetNotFound: "Compte introuvable.",
    passwordResetWeak: "Mot de passe : au moins 8 caractères, une lettre et un chiffre.",
    rateLimit: "Trop de tentatives. Réessayez un peu plus tard.",
    registrationFailed: "Impossible de créer le compte.",
    registrationMissing: "Remplissez les champs obligatoires.",
    resendResponse: "Si le compte attend une confirmation, nous avons renvoyé l'email.",
    resendWait: "Vous pouvez renvoyer dans 60 secondes.",
    smtpUnavailable: "La récupération du mot de passe est temporairement indisponible. Réessayez plus tard."
  },
  pl: {
    accountBlocked: "Konto jest zablokowane.",
    captchaRequired: "Potwierdź, że nie jesteś robotem.",
    disposableEmail: "Użyj prawdziwego adresu email.",
    emailInvalid: "Wpisz poprawny email.",
    emailNotConfirmed: "Potwierdź email, aby wejść do panelu.",
    forgotFailed: "Nie udało się wysłać wiadomości resetującej.",
    forgotResponse: "Jeśli konto z tym emailem istnieje, wysłaliśmy link do resetowania hasła.",
    invalidLogin: "Nieprawidłowy email lub hasło.",
    loginFailed: "Nie udało się zalogować.",
    loginMissing: "Wpisz email i hasło.",
    passwordMissingToken: "Link resetujący jest niepełny.",
    passwordResetFailed: "Nie udało się zaktualizować hasła.",
    passwordResetInvalid: "Link resetujący jest nieprawidłowy lub wygasł.",
    passwordResetNotFound: "Nie znaleziono konta.",
    passwordResetWeak: "Hasło: minimum 8 znaków, litera i cyfra.",
    rateLimit: "Za dużo prób. Spróbuj trochę później.",
    registrationFailed: "Nie udało się utworzyć konta.",
    registrationMissing: "Uzupełnij wymagane pola.",
    resendResponse: "Jeśli konto oczekuje na potwierdzenie, wysłaliśmy email ponownie.",
    resendWait: "Możesz wysłać ponownie za 60 sekund.",
    smtpUnavailable: "Odzyskiwanie hasła jest tymczasowo niedostępne. Spróbuj później."
  },
  cs: {
    accountBlocked: "Účet je zablokován.",
    captchaRequired: "Potvrďte, že nejste robot.",
    disposableEmail: "Použijte skutečnou e-mailovou adresu.",
    emailInvalid: "Zadejte platný e-mail.",
    emailNotConfirmed: "Potvrďte e-mail, abyste mohli vstoupit do pracovního prostoru.",
    forgotFailed: "Nepodařilo se odeslat e-mail pro obnovení.",
    forgotResponse: "Pokud účet s tímto e-mailem existuje, poslali jsme odkaz pro obnovení hesla.",
    invalidLogin: "Neplatný e-mail nebo heslo.",
    loginFailed: "Přihlášení se nezdařilo.",
    loginMissing: "Zadejte e-mail a heslo.",
    passwordMissingToken: "Odkaz pro obnovení je neúplný.",
    passwordResetFailed: "Nepodařilo se aktualizovat heslo.",
    passwordResetInvalid: "Odkaz pro obnovení je neplatný nebo vypršel.",
    passwordResetNotFound: "Účet nebyl nalezen.",
    passwordResetWeak: "Heslo: alespoň 8 znaků, jedno písmeno a jedna číslice.",
    rateLimit: "Příliš mnoho pokusů. Zkuste to později.",
    registrationFailed: "Účet se nepodařilo vytvořit.",
    registrationMissing: "Vyplňte povinná pole.",
    resendResponse: "Pokud účet čeká na potvrzení, poslali jsme e-mail znovu.",
    resendWait: "Znovu odeslat můžete za 60 sekund.",
    smtpUnavailable: "Obnovení hesla je dočasně nedostupné. Zkuste to později."
  },
  es: {
    accountBlocked: "La cuenta está bloqueada.",
    captchaRequired: "Confirma que no eres un robot.",
    disposableEmail: "Usa una dirección de email real.",
    emailInvalid: "Introduce un email válido.",
    emailNotConfirmed: "Confirma tu email para entrar al espacio de trabajo.",
    forgotFailed: "No se pudo enviar el email de recuperación.",
    forgotResponse: "Si existe una cuenta con este email, hemos enviado un enlace para restablecer la contraseña.",
    invalidLogin: "Email o contraseña incorrectos.",
    loginFailed: "No se pudo iniciar sesión.",
    loginMissing: "Introduce email y contraseña.",
    passwordMissingToken: "El enlace de recuperación está incompleto.",
    passwordResetFailed: "No se pudo actualizar la contraseña.",
    passwordResetInvalid: "El enlace de recuperación no es válido o ha caducado.",
    passwordResetNotFound: "Cuenta no encontrada.",
    passwordResetWeak: "Contraseña: al menos 8 caracteres, una letra y un número.",
    rateLimit: "Demasiados intentos. Prueba un poco más tarde.",
    registrationFailed: "No se pudo crear la cuenta.",
    registrationMissing: "Completa los campos obligatorios.",
    resendResponse: "Si la cuenta espera confirmación, hemos enviado el email otra vez.",
    resendWait: "Puedes enviar de nuevo en 60 segundos.",
    smtpUnavailable: "La recuperación de contraseña no está disponible temporalmente. Prueba más tarde."
  },
  de: {
    accountBlocked: "Das Konto ist gesperrt.",
    captchaRequired: "Bestätige, dass du kein Roboter bist.",
    disposableEmail: "Verwende eine echte E-Mail-Adresse.",
    emailInvalid: "Gib eine gültige E-Mail-Adresse ein.",
    emailNotConfirmed: "Bestätige deine E-Mail, um den Arbeitsbereich zu öffnen.",
    forgotFailed: "Die E-Mail zum Zurücksetzen konnte nicht gesendet werden.",
    forgotResponse: "Wenn ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen gesendet.",
    invalidLogin: "E-Mail oder Passwort ist falsch.",
    loginFailed: "Anmeldung fehlgeschlagen.",
    loginMissing: "Gib E-Mail und Passwort ein.",
    passwordMissingToken: "Der Link zum Zurücksetzen ist unvollständig.",
    passwordResetFailed: "Das Passwort konnte nicht aktualisiert werden.",
    passwordResetInvalid: "Der Link zum Zurücksetzen ist ungültig oder abgelaufen.",
    passwordResetNotFound: "Konto nicht gefunden.",
    passwordResetWeak: "Passwort: mindestens 8 Zeichen, ein Buchstabe und eine Zahl.",
    rateLimit: "Zu viele Versuche. Versuche es später noch einmal.",
    registrationFailed: "Das Konto konnte nicht erstellt werden.",
    registrationMissing: "Fülle die Pflichtfelder aus.",
    resendResponse: "Wenn das Konto auf Bestätigung wartet, haben wir die E-Mail erneut gesendet.",
    resendWait: "Du kannst in 60 Sekunden erneut senden.",
    smtpUnavailable: "Passwortwiederherstellung ist vorübergehend nicht verfügbar. Versuche es später erneut."
  }
};
