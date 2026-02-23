# Auth API

Authentication for GamePulse is handled by the NestJS backend. It uses email/password registration and login with HTTP-only cookies for access and refresh tokens.

## Swagger (interactive docs)

With the NestJS server running, open **http://localhost:3000/api/docs** to use the Swagger UI. You can try the auth endpoints (register, login, logout) from the browser and see request/response schemas.

## Base URL

- Local: `http://localhost:3000`
- Auth prefix: `/auth`

## Endpoints

### POST `/auth/register`

Register a new user with email and password.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "your-secure-password"
}
```

- `email`: valid email (required)
- `password`: string, min length 6 (required)

**Response** (201)

- Sets cookies: `accessToken`, `refreshToken` (HTTP-only, sameSite lax)
- Body: `{ "user": { "id": "<uuid>", "email": "user@example.com" }, "status": "success" }`

**Errors**

- `409 Conflict`: User with this email already exists

---

### POST `/auth/login`

Log in with email and password.

**Request body**

```json
{
  "email": "user@example.com",
  "password": "your-secure-password"
}
```

**Response** (200)

- Sets cookies: `accessToken`, `refreshToken` (HTTP-only, sameSite lax)
- Body: `{ "user": { "id": "<uuid>", "email": "user@example.com" }, "status": "success" }`

**Errors**

- `401 Unauthorized`: Invalid credentials (wrong email or password)

---

### POST `/auth/logout`

Log out the current user. Clears auth cookies. If the request is authenticated (e.g. via a future JWT guard), server-side sessions are revoked.

**Response** (200)

- Clears cookies: `refreshToken`, `accessToken`
- Body: `{ "message": "Logged out successfully" }`

---

## Cookies

| Cookie         | Purpose      | Max age   |
|----------------|-------------|-----------|
| `accessToken` | JWT for API auth | 15 min  |
| `refreshToken`| Opaque token for refresh | 7 days |

Cookies are `httpOnly`, `sameSite: 'lax'`, and `secure` in production. The frontend should send credentials (`credentials: 'include'`) when calling these endpoints so cookies are sent and set.

## Environment variables

| Variable              | Description                    | Example                    |
|-----------------------|--------------------------------|----------------------------|
| `DATABASE_URL`        | PostgreSQL connection string   | `postgresql://user:pass@host:5432/db` |
| `JWT_ACCESS_SECRET`   | Secret for signing access JWT  | (required)                 |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry          | `15m` (default)            |
| `JWT_REFRESH_SECRET`  | Not used in current flow       | (optional)                |
| `JWT_REFRESH_EXPIRES_IN` | Not used in current flow    | (optional)                 |
| `APP_URL`             | Backend base URL (Steam returnURL/realm) | `http://localhost:3000` |
| `FRONTEND_URL`        | Frontend base URL for redirects after Steam | `http://localhost:3000` |
| `DASHBOARD_PATH`      | Path to redirect after Steam login/link   | `/dashboard` (default) |

## Implementation notes

- Passwords are hashed with bcrypt (10 rounds) before storage.
- Sessions are stored in `user_sessions` with hashed refresh tokens; `device_id` defaults to `'default'` if not provided.
- Access tokens are JWTs with payload `{ sub: userId }`; use them in protected routes via a JWT guard (to be wired for logout and protected APIs).
