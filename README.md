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
