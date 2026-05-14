# Timviz Smoke Checklist (Performance-safe)

Use this checklist before each deploy from `performance/optimize-timviz`.

## Auth & onboarding
- [ ] Master registration
- [ ] Master login
- [ ] Profession/category selection

## Core entities
- [ ] Create service
- [ ] Edit service
- [ ] Create client
- [ ] Edit client

## Calendar / bookings
- [ ] Create appointment with client
- [ ] Create appointment without client
- [ ] Quick booking from free slot
- [ ] Overlap booking flow
- [ ] Delete appointment
- [ ] Move/resize appointment
- [ ] Day schedule loads
- [ ] Week/month modes load

## Working hours
- [ ] Update working days/hours
- [ ] Add break/non-working period

## Public booking
- [ ] Open public business profile
- [ ] Submit online booking
- [ ] Booking appears in owner calendar

## Admin / superadmin
- [ ] Superadmin login
- [ ] Users list opens
- [ ] Services moderation list opens
- [ ] Photos moderation list opens
- [ ] Impersonation works

## Platform checks
- [ ] `npm run build` passes
- [ ] No new console/runtime crash on key pages
- [ ] RU / UK / EN routes still render

