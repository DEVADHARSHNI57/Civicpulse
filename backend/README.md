# CivicPulse Backend (Spring Boot)

## Local Run

```bash
cd backend
mvn spring-boot:run
```

API health check: `GET /api/auth/test`

## Environment Variables

Set these in local `.env` (not committed) or your hosting platform:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION` (optional, default `86400000`)
- `CORS_ALLOWED_ORIGINS` (comma-separated, include your Netlify domain)
- `PORT` (set by Render automatically)

Example CORS value:

```text
http://localhost:3000,http://localhost:5173,http://localhost:8080,http://localhost:8081,https://your-netlify-site.netlify.app
```

## Free Deployment (Render)

This repo includes:

- `backend/Dockerfile`
- `render.yaml`

Steps:

1. Create a **Web Service** on Render from this repo.
2. Render reads `render.yaml` and builds from `backend/`.
3. Add required env vars in Render dashboard.
4. Set Health Check Path: `/api/auth/test`.
5. Deploy and copy backend URL (example: `https://civicpulse-backend.onrender.com`).

Then update frontend config:

`frontend/config.js`

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://civicpulse-backend.onrender.com",
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "your_supabase_anon_key"
};
```
