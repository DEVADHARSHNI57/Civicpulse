# CivicPulse

CivicPulse is a civic issue reporting platform where citizens can submit complaints, track progress, and receive notifications while admins and authorities manage resolution workflows.

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Java 17, Spring Boot 3, Spring Security, Spring Data JPA
- Database: PostgreSQL
- Auth: JWT (JSON Web Tokens)
- Realtime/Optional client integration: Supabase JS
- Build tools: Maven (backend)

## Project Structure

- `frontend/` - UI pages, scripts, and browser config
- `backend/` - Spring Boot API, security, services, repositories, schema

## Secure Configuration

No secrets are stored in tracked source files.

### 1. Backend environment

1. Copy `backend/.env.example` to `backend/.env`.
2. Fill real values for:
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `JWT_EXPIRATION` (optional)
   - `SERVER_PORT` (optional)

Spring Boot loads `.env` using `spring.config.import` from `backend/src/main/resources/application.properties`.

### 2. Frontend runtime config

1. Copy `frontend/config.example.js` to `frontend/config.js`.
2. Set:
   - `API_BASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

Important: `SUPABASE_ANON_KEY` is public client config by design. Never place service-role or private keys in frontend files.

### 3. Global template

You can also use root `.env.example` as a reference for both backend and frontend variables.

## Run Locally

### Backend

```bash
cd backend
mvn spring-boot:run
```

Default API URL: `http://localhost:8081`

### Frontend

Serve `frontend/` with any static server and open `index.html`.

Example:

```bash
cd frontend
npx serve .
```

## Security Notes

- `.env` files are ignored by Git.
- `frontend/config.local.js` is ignored by Git.
- Do not commit database passwords, JWT signing keys, or service-role keys.
- If secrets were previously pushed, rotate them immediately.

## API + UI Flow

- Users authenticate via backend endpoints and receive JWT tokens.
- Frontend sends token in `Authorization: Bearer <token>` for protected routes.
- Complaint lifecycle is handled by backend services with admin/authority updates reflected in UI.

## License

MIT
