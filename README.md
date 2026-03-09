# Betting Backend

Backend for **Badsha AutoBet** app. Validates UID + Key and provides an admin UI to generate keys.

## Setup

```bash
npm install
npm start
```

Runs on `http://localhost:3000` (or `PORT` env var).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/validate` | Body: `{ "uid": "...", "key": "..." }` — Returns 200 if valid |
| POST | `/api/generate` | Generates new UID + Key |
| GET | `/api/keys` | Lists all keys |

## Admin

Open **http://localhost:PORT/admin** to generate UID and keys manually.

## Hosting

Deploy to Railway, Render, or any Node.js host. Set `PORT` if required. Keys are stored in `keys.json` (create it on first generate).

## App Configuration

In the Android app, set `AuthApi.BASE_URL` in `AuthApi.kt` to your hosted URL (e.g. `https://your-app.railway.app`).
