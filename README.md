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

Пример cron (ежедневно в 03:30):

```bash
30 3 * * * cd /Users/Vitaliy/Graviti/Rezervo && /usr/bin/env npm run db:backup >> /Users/Vitaliy/Graviti/Rezervo/logs/db-backup.log 2>&1
```

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
