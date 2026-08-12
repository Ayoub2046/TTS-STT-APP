# MaayMaxaa DataHub

A collaborative platform for collecting, reviewing, and publishing high-quality **Maay ↔ Maxaa** parallel translation data.

Maay (Maay Maay) and Maxaa-tiri (Maxaa Soomaali) are two major dialects of the Somali language. This project builds the public parallel corpus that will power future Somali-NL translation models.

## Features

- 🇸🇴 Translation collection — Maay → Maxaa and Maxaa → Maay
- 🔍 Human review with side-by-side correction interface
- ⭐ Quality scoring (1–5 stars) with dataset quality metrics
- 🧪 Automatic validation (empty text, duplicates, untranslated detection)
- 📦 Dataset versioning with train / validation / test splits
- ☁️ Hugging Face publishing (backend-only token, secure)
- 📴 PWA with offline collection and sync queue
- 📊 Admin analytics, user roles, audit logs

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Lucide, vite-plugin-pwa |
| Backend  | Node.js, Express, TypeScript, Supabase, JWT, Zod, Multer, Helmet, CORS, Rate limiting |
| Database | Supabase PostgreSQL + Storage (RLS enabled) |
| Dataset  | Hugging Face Hub (JSONL, CSV) |

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev            # http://localhost:4000
```

### 2. Database

1. Create a [Supabase](https://supabase.com) project.
2. Run `database/schema.sql` in the SQL Editor.
3. Run `database/migrations/001_admin_utilities.sql`.
4. (Optional) Run `database/seed.sql`.
5. Promote your first user to admin in the Supabase Dashboard (Auth → Users → edit profile `role` to `admin`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Project Structure

```
frontend/                  React PWA (Vite + TS + Tailwind)
backend/                   Express + TypeScript API
database/                  schema.sql, migrations, seed.sql
scripts/                   dataset-cli (validate | generate | split)
docs/                      ARCHITECTURE, API, DEPLOYMENT, etc.
```

## Roles

| Role        | Capabilities |
|-------------|--------------|
| Contributor | Submit translations, drafts, view status, edit own submissions |
| Reviewer    | Review queue, approve/reject/request correction, quality score |
| Admin       | User management, dataset publishing to Hugging Face, exports, audit logs |

## Dataset Publishing Flow

```
Contributor → Validation → Pending Review → Reviewer/Admin
  → Approved → Dataset Builder → Split 80/10/10 → Hugging Face
```

See `docs/DATASET_GUIDE.md` for dataset guidelines and `docs/HUGGINGFACE.md` for publishing.

## Development Phases

```
STEP 01-03  Project setup · Supabase DB · Auth         ✅ completed
STEP 04-07  Dashboards · Collection · Admin · Review   ✅ completed
STEP 08-10  Validation · Dataset Engine · HF Push      ✅ completed
STEP 11-12  PWA + offline · Analytics                  ✅ completed
STEP 13     Documentation & deployment                 ✅ completed
```

## Deployment

- Whole app (frontend + Express API) → **Vercel** (single project, see `docs/DEPLOYMENT.md`)
- Database → Supabase
- Dataset → Hugging Face

See `docs/DEPLOYMENT.md`.

## Security

- `HF_TOKEN` lives **only** on the backend (`.env`), never in the frontend.
- All admin endpoints check `requireAuth → requireRole("admin")`.
- Rate limiting, Helmet, CORS allow-list, audit logging on every write.

## License

This project and its dataset are released for open research and development of Somali language technology.