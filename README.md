# Betting Backend (Supabase + Vercel)

Backend for **Badsha AutoBet** app. Validates UID + Key and provides admin UI to generate keys.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Get **Project URL** and **service_role key** from Settings → API

### 2. Vercel

1. Import this repo in [vercel.com](https://vercel.com)
2. **Root Directory**: If the repo root is this project, leave blank. If this is a subfolder of a larger repo, set Root Directory to `betting_backend`
3. Add Environment Variables:
   - `SUPABASE_URL` – your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` – service_role key (not anon)
4. Deploy

**If you get 404**: Visit `/admin` or `/api/keys` directly. Root `/` redirects to `/admin`.

### 3. Android App

Set `AuthApi.BASE_URL` in the app to your Vercel URL (e.g. `https://your-project.vercel.app`).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/validate` | Body: `{ "uid", "key" }` – Returns `{ valid, expiry }` |
| POST | `/api/generate` | Body: `{ "uid", "expiry" }` – Generates key |
| GET | `/api/keys` | Lists all keys |

## Admin

Open **https://your-project.vercel.app/admin** to generate keys.
