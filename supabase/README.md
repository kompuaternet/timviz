# Supabase Migration

## 1. Apply the schema

Open the Supabase SQL editor and run:

- [schema.sql](/Users/Vitaliy/Graviti/Rezervo/supabase/schema.sql)

This creates or updates the tables used by:

- business accounts and settings
- services
- calendar appointments
- client profiles
- support tickets and replies
- public search

## 2. Configure environment variables

Add these variables to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3. Import existing local JSON data

Run:

```bash
npm run migrate:supabase
```

The importer reads:

- `data/pro-data.json`
- `data/pro-calendar.json`
- `data/pro-clients.json`
- `data/pro-support.json`
- `data/bookings.json`

and upserts them into Supabase.

## 4. Verify

Check these flows after import:

- account login
- business settings and photos
- services CRUD
- calendar create/edit/delete
- clients list and search
- support chat
- public catalog/search
