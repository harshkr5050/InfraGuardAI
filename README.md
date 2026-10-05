# InfraGuard AI — Full-Stack Hackathon Project

A working predictive-maintenance dashboard for public infrastructure. The same repository contains the frontend and Vercel serverless backend. MySQL stores real data for assets, citizen complaints, maintenance tasks/history, sensor snapshots and administrator login.

## Included features

- Administrator login backed by MySQL
- Dashboard with risk/health metrics
- Roads, bridges, drainage, water systems, streetlights and public buildings
- Explainable risk predictions
- Maintenance priority score based on risk + public impact + criticality
- Simulated sensor events: heavy rain, traffic, complaints and sensor failure
- Citizen complaint form that changes the linked asset risk in the database
- Maintenance assignment and status workflow
- Completing maintenance automatically lowers risk and records savings/history
- Risk map, reports and ₹10 lakh budget optimizer
- Reset-demo endpoint to restore seeded hackathon data
- Responsive Vercel-ready frontend

## Demo login

- Email: `admin@infraguard.ai`
- Password: `demo123`

The password is stored as a SHA-256 hash for this hackathon prototype. Login returns a signed 12-hour API session token. For a production system, replace this with a full authentication provider and salted password hashing.

## Architecture

```text
Browser / Vercel static site
        |
        v
Vercel Node.js serverless APIs (/api/*)
        |
        v
MySQL 8 database
        |
        +-- users
        +-- assets (sensor_data JSON)
        +-- complaints
        +-- maintenance_tasks
        +-- maintenance_history
```

## Local setup with Docker MySQL

1. Install Node.js 20+ and Docker Desktop.
2. Open a terminal in this project folder.
3. Start MySQL:

```bash
docker compose up -d
```

4. Copy `.env.example` to `.env.local`.
5. Install packages:

```bash
npm install
```

6. Start the Vercel local runtime:

```bash
npx vercel dev
```

Open the local URL shown by Vercel. The API automatically creates the tables and demo records on first request, so running the SQL manually is optional.

## Deploy frontend + backend to Vercel

This repository is already Vercel-compatible. Push the whole folder to GitHub and import that repository into Vercel.

The only required production setting is a **cloud MySQL database that Vercel can reach**. A MySQL server running only on your laptop cannot be reached by Vercel.

In your Vercel project, add:

```text
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME
DB_SSL=true-or-false
APP_SECRET=replace-with-a-long-random-secret
```

Then deploy/redeploy. On the first API request the project creates its tables and inserts demo data automatically.

## API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | API/database health |
| `/api/auth/login` | POST | Administrator login |
| `/api/bootstrap` | GET | Load the complete dashboard state |
| `/api/assets` | GET/POST | List or add assets |
| `/api/complaints` | GET/POST | List/submit citizen complaints |
| `/api/maintenance` | GET/POST/PATCH | Maintenance workflow |
| `/api/simulate` | POST | Hackathon live-event simulation |
| `/api/reports` | GET | Aggregated reporting data |
| `/api/reset` | POST | Restore the seeded demo state |

## Risk logic used in the prototype

Priority score shown in the UI:

```text
Priority Score = Risk × 0.50 + Public Impact × 0.30 + Criticality × 0.20
```

Priority levels:

```text
85–99   Critical
70–84   High
45–69   Medium
0–44    Low
```

Complaint severity also raises the asset's persisted risk:

```text
Low       +2
Medium    +4
High      +7
Emergency +12
```

The live simulation writes changes to MySQL, so the dashboard state remains changed after refresh until you use **Reset Demo**.

## Database files

`database/schema.sql` contains the explicit MySQL schema.

`database/seed.sql` contains a readable SQL seed set. The serverless application also contains equivalent idempotent bootstrap logic in `lib/seed.js`, so a fresh cloud database can initialize itself automatically.

## Optional manual database initialization

With `DATABASE_URL` configured locally:

```bash
npm run db:init
```

## Important hackathon note

The platform demonstrates predictive-maintenance decision logic using realistic seeded/simulated observations. It does **not** claim the demo risk values are predictions from a production-trained government infrastructure model. The architecture is intentionally ready for a trained model to replace or augment the scoring layer later.

## Suggested Vercel settings

- Framework preset: Other
- Root directory: repository root
- Build command: leave blank
- Output directory: leave blank
- Install command: default (`npm install`)

`vercel.json` sets the serverless function duration. No secret is committed to this repository; use Vercel Environment Variables for real credentials.
