# Rezervo

Стартовый веб-MVP для сервиса онлайн-записи в духе Fresha:

- веб-платформа для клиентов, мастеров и салонов;
- следующая стадия: Telegram-бот для напоминаний и повторной записи;
- затем мобильное приложение.

## Запуск

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm install
npm run dev -- --hostname 127.0.0.1 --port 3005
```

## Quality / Testing

В проект добавлен автоматический слой качества для публичного сайта, каталога, страницы компании, бронирования, локализации и мобильной верстки.

Локальный запуск:

```bash
npm run typecheck
npm run quality:fast
npm run quality:ui
npm run quality:booking
npm run quality
npm run test:i18n
npm run test:e2e
npm run test:e2e:mobile
npm run test:e2e:localization
npm run test:e2e:booking
npm run test:e2e:catalog
npm run test:e2e:company
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:report
npm run test:lighthouse
```

Что проверяется:

1. Playwright e2e: каталог, страница компании, mobile header, смена языка, процесс бронирования, sticky footer, основные ссылки.
2. Layout helpers: горизонтальный overflow и элементы, которые вылезают за viewport.
3. Runtime guards: `console.error`, uncaught `pageerror`, неожиданные `500` и битые статические ресурсы.
4. Локализация без браузера: `npm run test:i18n` автоматически определяет языки из `lib/site-language.ts`, разбирает TS-словари, сравнивает вложенные ключи, ловит пустые значения, `TODO/FIXME`, `undefined`, `null`, `NaN`, `[object Object]` и печатает отчёт по языкам, словарям, ключам, missing/invalid и fallback warnings.
5. Локализация в браузере: `npm run test:e2e:localization` проверяет главную, каталог, страницу компании, аккаунт, success page при доступном fixture booking, mobile menu, booking dialog и LanguageSwitcher на ширинах 360/390/430.
6. Accessibility: axe-core для главной, каталога, страницы компании, аккаунта и booking dialog.
7. Visual regression: подготовлены snapshots для ключевых mobile-экранов. Запускать отдельно:

```bash
PLAYWRIGHT_VISUAL=1 npm run test:e2e -- tests/visual
```

HTML-отчёт Playwright:

```bash
npx playwright show-report
```

Рабочее правило для Codex и разработчиков:

1. Перед push запускать релевантную quality-команду.
2. После UI/mobile/i18n/header задач запускать `npm run quality:ui`.
3. После booking-задач запускать `npm run quality:booking`.
4. После небольших не-UI правок минимум запускать `npm run quality:fast`.
5. Если GitHub Actions красный, не деплоить и не мержить до исправления.
6. Pre-push hook запускает `npm run quality:fast`; полный Playwright запускается вручную для UI-задач и в GitHub Actions.

Lighthouse CI пишет отчёты в `.lighthouseci/`. На первом этапе пороги настроены как warning, чтобы видеть performance/accessibility/SEO отчёт без блокировки деплоя.

Production runtime errors:

1. Sentry подключается только если задан `SENTRY_DSN` или `NEXT_PUBLIC_SENTRY_DSN`.
2. Для sourcemaps можно добавить `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
3. Перед отправкой события очищаются email, телефоны, токены, cookies и другие персональные поля.
4. В booking-flow добавлены breadcrumbs: открыт modal, выбраны услуги, шаг, время и старт отправки заявки. Персональные данные клиента не логируются.

## Что дальше

Следующие логичные экраны для разработки:

1. Каталог салонов и мастеров.
2. Карточка бизнеса или специалиста.
3. Экран выбора даты и времени.
4. Личный кабинет администратора с календарем.

## Бронирования

- Без env-переменных бронирования сохраняются локально в `data/bookings.json`.
- Профессиональные аккаунты, бизнесы, участники и услуги локально сохраняются в `data/pro-data.json`.
- Для подключения Supabase скопируй `.env.example` в `.env.local`.
- SQL для таблиц лежит в `supabase/schema.sql`.

## Apple вход на сайте

Для веб-входа через Apple нужен Services ID из Apple Developer. iOS Bundle ID (`com.timviz.master`) используется для мобильного приложения и проверки audience, но не заменяет Services ID для сайта.

Минимальные env:

1. `APPLE_SERVICE_ID=com.timviz.web` (или фактический Services ID из Apple Developer).
2. `APPLE_CLIENT_ID=com.timviz.web` (можно указать тот же Services ID для совместимости со старым названием env).
3. `APPLE_REDIRECT_URI=https://timviz.com/api/pro/auth/apple/callback`.
4. `APP_URL=https://timviz.com` (если `APPLE_REDIRECT_URI` не задан, callback строится из публичного URL сайта).

В Apple Developer для Services ID добавь:

1. Domain: `timviz.com`.
2. Return URL: `https://timviz.com/api/pro/auth/apple/callback`.

Если домен или Services ID отличаются, те же значения должны совпадать в Apple Developer, Railway env и `.env.local`.

## Бэкап БД

В проект добавлены скрипты резервного копирования и восстановления:

1. `npm run db:backup`
2. `npm run db:restore -- --input <папка_бэкапа> --yes`
3. `npm run db:upload:gdrive`
4. `npm run db:backup:cloud`

Как работает backup:

1. Если задан `SUPABASE_DB_URL` (или `DATABASE_URL`) и доступен `pg_dump`, создаётся полный дамп Postgres (`database.dump`) + schema (`schema.sql`).
2. Если `pg_dump` недоступен, включается fallback-режим через Supabase API: таблицы сохраняются в `tables/*.json.gz` + `manifest.json`.
3. Старые копии автоматически удаляются по `DB_BACKUP_KEEP` (по умолчанию 14 последних).

Минимальные env для backup через Supabase API:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY` (или `SUPABASE_SECRET_KEY`)

Рекомендуемые env:

1. `DB_BACKUP_MODE=auto`
2. `DB_BACKUP_DIR=backups/db`
3. `DB_BACKUP_KEEP=14`
4. `DB_BACKUP_PAGE_SIZE=1000`
5. `SUPABASE_DB_URL=` (для полноценного `pg_dump`)
6. `DB_BACKUP_ARCHIVE_DIR=backups/db-archives`
7. `DB_BACKUP_CLOUD_UPLOAD=auto`

Восстановление:

1. По умолчанию берется последний бэкап из `DB_BACKUP_DIR`.
2. Для защиты требуется подтверждение: `DB_RESTORE_CONFIRM=YES` или флаг `--yes`.
3. Флаг `--truncate` очищает таблицы перед восстановлением.

Примеры:

```bash
npm run db:backup

DB_RESTORE_CONFIRM=YES npm run db:restore -- --yes

DB_RESTORE_CONFIRM=YES npm run db:restore -- --input backups/db/2026-05-02T08-00-00-000Z --truncate --yes
```

Загрузка последнего бэкапа в Google Drive:

```bash
npm run db:upload:gdrive
```

Пример cron (ежедневно в 03:30):

```bash
30 3 * * * cd /Users/Vitaliy/Graviti/Rezervo && /usr/bin/env npm run db:backup >> /Users/Vitaliy/Graviti/Rezervo/logs/db-backup.log 2>&1
```

### Автономно без твоего компьютера

Добавлен workflow: `.github/workflows/db-backup-cloud.yml`.

Что делает:

1. Запускается ежедневно в `00:30 UTC` и вручную через `workflow_dispatch`.
2. Делает backup (`pg_dump`, если доступен, иначе Supabase JSON).
3. Загружает backup в Google Drive (если заданы секреты).
4. Сохраняет backup как GitHub Artifact (30 дней).

Секреты для GitHub Actions:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`
3. `SUPABASE_DB_URL` (рекомендуется)
4. `GDRIVE_SERVICE_ACCOUNT_JSON`
5. `GDRIVE_FOLDER_ID`
6. `GDRIVE_BACKUP_KEEP` (например `30`)

Важно для Google Drive:

1. Создай папку в Google Drive.
2. Поделись папкой с email service account.
3. В `GDRIVE_FOLDER_ID` укажи ID этой папки.

Если Google Drive секреты не заданы, workflow все равно сохранит backup в GitHub Artifacts.

## Профессиональный flow

- Вход для профи: `/pro`
- Создание аккаунта: `/pro/create-account`
- Настройка владельца или участника салона: `/pro/setup`
- Рабочее пространство: `/pro/workspace?professionalId=...`

Что сохраняется:

1. Профессионал
2. Бизнес
3. Участие в бизнесе
4. Базовые услуги бизнеса

## App Store Premium

Мобильная подписка подключается через RevenueCat и синхронизируется с теми же полями Premium, которые использует сайт:

1. `plan`
2. `premium_status`
3. `premium_until`

Новые владельцы бизнеса получают 14 дней пробного Premium: при регистрации выставляются `plan=premium`, `premium_status=trialing`, `premium_until=<created_at + 14 days>`. После истечения `premium_until` платные функции закрываются Pro-paywall, пока пользователь не оформит подписку.

Базовые product id:

1. `timviz_premium_monthly`
2. `timviz_premium_yearly`

Entitlement id в RevenueCat: `premium`.

Env для мобильной сборки:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium
EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID=timviz_premium_monthly
EXPO_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID=timviz_premium_yearly
```

Если `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` не задан, iOS-сборка использует прямой StoreKit fallback через App Store products с теми же product id. Это позволяет тестировать подписку в TestFlight без RevenueCat, пока RevenueCat-проект и server key ещё не подключены.

Env для сайта/API на Railway:

```bash
REVENUECAT_SECRET_API_KEY=
REVENUECAT_ENTITLEMENT_ID=premium
REVENUECAT_WEBHOOK_SECRET=
```

Webhook RevenueCat:

```text
https://timviz.com/api/revenuecat/webhook
```

Важно: реальные покупки и восстановление подписки работают только в native build, TestFlight или App Store build. В Expo Go RevenueCat работает в preview mode, поэтому там можно проверить экран Premium, но не настоящую оплату App Store.
