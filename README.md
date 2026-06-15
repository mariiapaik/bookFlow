# BookFlow — Appointment Booking System

Appointment booking platform built for a beauty & wellness studio — service
catalog, real-time availability, email confirmations, automated 24h reminders,
and a staff admin panel for managing the schedule.

> Freelance project · Beauty & Wellness. Source private per client agreement.

## Features

- **Service catalog** — name, duration, price; staff manage what's bookable.
- **Availability engine** — staff set weekly working hours; the API computes
  free slots per service per day, skipping past times and overlaps.
- **Customer booking flow** — pick a service, date, and slot; enter contact details.
- **Email confirmations** — sent on booking via Nodemailer (logged to console in demo mode).
- **24h reminders** — a BullMQ delayed job fires one day before each appointment.
- **Admin panel** — list/filter bookings, mark confirmed / completed / cancelled.
- **Role-based access** — `owner` manages the catalog & hours; `staff` manages bookings.
- **Double-booking protection at the DB level** — a Postgres `EXCLUDE` constraint
  (`btree_gist`) makes overlapping confirmed bookings impossible even under
  concurrent requests.

## Tech Stack

NestJS · PostgreSQL · TypeORM · BullMQ · Redis · Nodemailer · React · Vite · TailwindCSS

## Architecture

```
React (Vite + Tailwind)  ──HTTP──▶  NestJS API ──▶ PostgreSQL (services, bookings, hours, users)
   public booking flow                  │
   staff admin panel                    ├──▶ Redis + BullMQ  (24h reminder jobs)
                                        └──▶ Nodemailer       (confirmation / reminder / cancellation)
```

Backend modules: `auth` (JWT + RBAC), `catalog`, `availability`, `bookings`
(create + DB-level overlap guard), `mail`, `reminders` (BullMQ producer + worker).

## Quick Start (Docker)

```bash
docker compose up --build      # db, redis, backend (:3000), frontend (:8080)

# In another terminal, seed demo data (services, hours, owner/staff users).
# The runtime image ships compiled JS only, so run the built seed:
docker compose exec backend npm run seed:prod
```

Then open **http://localhost:8080**. Staff login at `/admin`.

Demo accounts:
- Owner — `owner@bookflow.app` / `owner123`
- Staff — `staff@bookflow.app` / `staff123`

## Local Development (without Docker)

You need Postgres and Redis running locally.

```bash
# backend
cd backend
cp .env.example .env
npm install
npm run seed          # one-time demo data
npm run start:dev     # http://localhost:3000/api

# frontend (separate terminal)
cd frontend
npm install
npm run dev           # http://localhost:5173 (proxies /api → :3000)
```

## Email in demo mode

If `SMTP_HOST` is unset, BookFlow logs every email (confirmation, reminder,
cancellation) to the backend console instead of sending — so the flow is fully
testable without a mail provider. Set the `SMTP_*` vars in `.env` to send for real.

## API overview

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET  | `/api/services` | public | Active service catalog |
| GET  | `/api/availability/slots?serviceId&date` | public | Free slots for a day |
| POST | `/api/bookings` | public | Create a booking |
| POST | `/api/auth/login` | public | Staff login → JWT |
| GET  | `/api/bookings?status=` | staff/owner | List bookings |
| PATCH| `/api/bookings/:id/status` | staff/owner | Change booking status |
| POST | `/api/services` | owner | Add a service |
| PUT  | `/api/availability/working-hours` | owner | Set weekly hours |
```
