# GigShield

GigShield is a React + Vite web app for gig-worker income protection simulation.

It models parametric payout behavior: when disruption signals (weather, AQI, outage-style events, and policy triggers) cross configured thresholds, payouts move through a guarded lifecycle with verification, anti-fraud checks, and auditability.

## What The App Includes

- Public marketing and product pages.
- OAuth and demo sign-in flows.
- Protected worker dashboard with dynamic weekly premium calculation.
- Trigger simulation with policy checks (cooldown, dedup, coverage, cap).
- Predictive Safety Net forecasting and policy tuning.
- Payout lifecycle management with selfie/gesture verification and security checks.
- Payout history, receipts, and retry handling.
- Community Heatmap, Team Protection, and Trust Center views.
- Admin operations panel with anomaly/moderation-aware workflow support.
- Optional Supabase persistence with local fallback.

## Route Map

Public routes:

- `/`
- `/product`
- `/pricing`
- `/triggers`
- `/fraud-guard`
- `/get-protected`
- `/signin`
- `/signup`
- `/auth`
- `/auth/callback`

Protected routes (require session):

- `/dashboard`
- `/payout`
- `/payout-received`
- `/payout-history`
- `/predictive-history`
- `/community-heatmap`
- `/team-protection`
- `/trust-center`
- `/admin-ops`

Compatibility redirects:

- `/support` -> `/dashboard`
- `/admin` -> `/admin-ops`

## Backend API

The project includes an Express server used by the frontend through the Vite proxy.

Endpoints:

- `POST /api/automation/risk-check`
	- Computes live risk and premium guidance using weather + optional AQI.
- `POST /api/chat`
	- CookieByte assistant endpoint backed by Groq.
- `GET /health`
	- Health check.

## Tech Stack

- Frontend: React 19, React Router, Tailwind CSS, GSAP, Lenis
- Backend: Express 5, CORS, dotenv
- Data/Persistence: Supabase JS client + localStorage fallback
- Verification: MediaPipe Tasks Vision assets copied to public static folder postinstall
- Testing: Vitest + Testing Library

## Local Setup

Prerequisites:

- Node.js 18+
- npm

Install:

```bash
npm install
```

Run frontend (Vite):

```bash
npm run dev
```

Run backend API (separate terminal):

```bash
npm run start:api
```

Default local ports:

- Frontend: `http://localhost:5173`
- API server: `http://localhost:3001`

## Environment Variables

Frontend (`.env`):

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ENABLE_BACKEND_PERSISTENCE=true
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
VITE_STRICT_TOKEN_ENFORCEMENT=false
```

Backend (`.env`):

```bash
PORT=3001
WEATHER_API_KEY=...
GROQ_API_KEY=...
```

Notes:

- If `WEATHER_API_KEY` is missing, the backend falls back to Open-Meteo for weather.
- If Supabase env vars are missing, the app logs a warning and continues with local fallback behavior.

## Supabase Schema Order

Run SQL files in this order:

1. `supabase/schema.sql`
2. `supabase/schema2.sql`
3. `supabase/schema3.sql`

## NPM Scripts

```bash
npm run start       # alias for vite
npm run dev         # frontend dev server
npm run start:api   # express backend
npm run build       # production build
npm run preview     # preview build
npm run lint        # eslint
npm run test        # vitest run
npm run test:watch  # vitest watch
```

## Testing

Run all tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

## Current Scope

Implemented:

- End-to-end UI flows for onboarding, triggers, verification, and payout states.
- Predictive and operations-focused modules in the dashboard/admin surfaces.
- Persistence pattern with backend-first attempt and local fallback.

Still simulated/mock in this repository:

- Real payment rail settlement.
- Full production-grade claims backend and external insurer integration.
- Full ML lifecycle (training, deployment, model governance).
