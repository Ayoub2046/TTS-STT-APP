# Deployment

```
                    INTERNET
                       │
          ┌────────────┴────────────┐
          │                         │
        Vercel                   Backend
       React PWA               Node/Express
          │                         │
          └────────────┬────────────┘
                       │
                   Supabase
                       │
            ┌──────────┴─────────┐
            │                    │
       PostgreSQL             Storage
                                 │
                                 ▼
                          Hugging Face
```

## Frontend → Vercel

```bash
cd frontend
npm run build
```

In Vercel: framework = Vite, build = `npm run build`, output = `dist`. Set env `VITE_API_URL` to the
production API base URL (e.g. `https://api.yoursite.com`).

## Backend → Render / Railway / Fly.io

Render — create a "Web Service", root = `backend`, build = `npm install && npm run build`,
start = `npm start`. Add all variables from `backend/.env.example`, including `HF_TOKEN`.

Set `CORS_ORIGINS` to your frontend domain (`https://your-app.vercel.app`).

## Environment Variables

Backend (`backend/.env`):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (server-only) |
| `SUPABASE_ANON_KEY` | anon key |
| `JWT_SECRET` | signing secret |
| `HF_TOKEN` | Hugging Face write token |
| `HF_DATASET_REPO` | e.g. `Ayoubadanabdi/Maay-Maxaa-Translation` |
| `CORS_ORIGINS` | comma-separated allowed origins |

Frontend (`frontend/.env`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL (empty = same origin via Vite proxy in dev) |

## Database

Host PostgreSQL in Supabase. Apply migrations once:

1. `database/schema.sql`
2. `database/migrations/001_admin_utilities.sql`

## Promote first admin

After registering your first user in the app, run in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
SELECT setval('profiles_role_seq', max(id)) FROM profiles;  -- not needed
```

Or use the Dashboard (Auth → Users → select user → edit profile row's `role`).

## Production checklist

- [ ] HTTPS everywhere (Vercel + Render handle it)
- [ ] Strong `JWT_SECRET`
- [ ] Restrict `CORS_ORIGINS` to your domain
- [ ] `HF_TOKEN` only in backend env
- [ ] Rate limiting already enabled (300 req / 15 min per IP)
- [ ] Back up Supabase (automatic)
- [ ] Keep dataset repo private until ready, then make public