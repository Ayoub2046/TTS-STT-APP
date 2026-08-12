# Deployment

```
                    INTERNET
                       │
          ┌────────────┴────────────┐
          │                         │
        Vercel ─────────────────────┘
   React PWA (frontend/dist)         Node/Express API (api/ function)
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

## Option A — Vercel (single project, recommended)

The whole app (static frontend **and** the Express API) deploys as **one Vercel project**.
The frontend is served from `frontend/dist` and the API runs as a single Vercel Function
wired up by `api/index.ts`; requests to `/api/*` are rewritten to that function by the root
`vercel.json`.

### 1. Repository setup (already in place)

- `vercel.json` — root project config: builds the frontend, sets `outputDirectory` to
  `frontend/dist`, rewrites `/api/*` → the API function, and provides an SPA fallback to
  `index.html`.
- `api/index.ts` — serverless entry that re-exports the Express app.
- `backend/src/server.ts` — skips `app.listen()` when running on Vercel
  (`process.env.VERCEL`), so the middleware-only Express app is called as a function.

### 2. Deploy

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In the [Vercel dashboard](https://vercel.com/new), import the repo.
3. Set the **Root Directory** to the repo root (leave the auto-detected settings,
   like Framework preset, as-is — the root `vercel.json` overrides what matters).
   Vercel builds the monorepo: installs all npm workspaces, runs `npm run build --workspace frontend`,
   then compiles `api/index.ts` into a Serverless Function.
4. Add the **Environment Variables** below.
5. Deploy.

### 3. Environment variables (Vercel → Project → Settings → Environment Variables)

Backend (needed by the `api/` Function at runtime):

| Variable                     | Purpose                                      |
|------------------------------|----------------------------------------------|
| `SUPABASE_URL`               | Supabase project URL                         |
| `SUPABASE_SERVICE_ROLE_KEY`  | service role key (server-only)               |
| `SUPABASE_ANON_KEY`          | anon key                                     |
| `JWT_SECRET`                 | signing secret (change from the default)     |
| `HF_TOKEN`                   | Hugging Face write token (optional)          |
| `HF_DATASET_REPO`            | e.g. `Ayoubadanabdi/Maay-Maxaa-Translation`  |
| `CORS_ORIGINS`               | comma-separated allowed origins (your Vercel domain — defaults to `http://localhost:5173`) |

Frontend (optional): the frontend calls the same-origin `/api/*` path by default, so
`VITE_API_URL` does **not** need to be set. Set it only if you move the API to another host.

### 4. Database

1. Create a [Supabase](https://supabase.com) project.
2. Run `database/schema.sql` in the SQL Editor.
3. Run `database/migrations/001_admin_utilities.sql`.

### 5. Promote first admin

After registering your first user in the app, run in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
```

Or use the Dashboard (Auth → Users → select user → edit profile row's `role`).

### 6. Verify locally like production

```bash
npx vercel login
npx vercel link
npx vercel dev   # serves static + /api function, matching the deployed routing
```

## Option B — Split deployment (frontend + backend on separate hosts)

| Part      | Where                       | How                                         |
|-----------|-----------------------------|---------------------------------------------|
| Frontend  | Vercel (Root Directory `frontend`) | framework preset **Vite**, output `dist` |
| Backend   | Render / Railway / Fly.io  | build `npm install && npm run build`, start `npm start`, all env vars |

Set `VITE_API_URL` on the frontend project to the backend URL and add the frontend domain to
`CORS_ORIGINS` on the backend.

## Production checklist

- [ ] HTTPS everywhere (Vercel handles it)
- [ ] Strong `JWT_SECRET`
- [ ] Restrict `CORS_ORIGINS` to your domain
- [ ] `HF_TOKEN` only in backend env
- [ ] Rate limiting already enabled (300 req / 15 min per IP)
- [ ] Back up Supabase (automatic)
- [ ] Keep dataset repo private until ready, then make public