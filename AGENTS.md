# AGENTS.md

Full codebase reference for AI agents working in this repository.

## Commands

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # start frontend (Vite) + backend (tsx watch) concurrently
pnpm build            # build frontend then backend
pnpm start            # run built frontend preview + backend concurrently
pnpm start:backend    # run only the built backend
pnpm start:frontend   # run only the built frontend preview
pnpm test             # run all backend tests (unit + integration)
pnpm test:unit        # run unit tests only (src/**/*.test.ts)
pnpm test:integration # run integration tests only (tests/integration/**/*.test.ts)
pnpm --filter @mailer/backend test:watch  # watch mode for backend tests
pnpm lint:check       # check formatting with prettier
pnpm lint:fix         # auto-fix formatting with prettier
```

## Architecture

pnpm monorepo with two workspaces:

- `apps/backend` — Fastify 5 API server (`@mailer/backend`)
- `apps/frontend` — Vite 7 + Tailwind CSS 4 frontend shell (`@mailer/frontend`)

### Backend (`apps/backend/src/`)

Entry point: `index.ts` → calls `loadConfig()`, `createMailModule()`, then `buildApp()` and listens.

**`buildApp(options)`** (`app.ts`) — creates the Fastify instance, registers a global error handler that normalises all thrown values into `AppError`, and mounts all routes under `/api/v1`.

**Modules** (`modules/`):

| Module | Purpose |
|--------|---------|
| `config` | Reads `.env` via `dotenv`, validates and returns typed `AppConfig`. Resolves `.env` from the repo root regardless of cwd. |
| `errors` | `AppError` class + factory functions (`invalidRequest`, `unauthorized`, `mailSendFailed`, `internalError`). The `expose` flag controls whether the original message is sent to the client. |
| `auth` | `hasValidBearerToken` — timing-safe bearer token comparison. |
| `mail` | `createMailModule(smtpConfig)` — wraps Nodemailer. `sendEmail()` returns the `messageId` or throws `mailSendFailed`. `verifyConnection()` is called at startup to fail fast if SMTP is unreachable. |

**Routes** (`routes/`):

- `GET /api/v1/health` — liveness probe, no auth.
- `POST /api/v1/mail/send` — requires `Authorization: Bearer <token>`. Manual JSON validation in `parseSendMailBody` (no schema library). Required fields: `to`, `subject`, `text`. Optional: `from`, `html`.

Error response shape:
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Unauthorized" } }
```

Success response shape (`mail/send`):
```json
{ "message": "Email sent successfully", "messageId": "<id>" }
```

**Tests** — Vitest. Unit tests sit next to source files (`*.test.ts`). Integration tests are in `tests/integration/` and use Fastify's `inject` (no real HTTP port needed). The `tests/e2e/` directory is reserved but excluded from runs.

### Frontend (`apps/frontend/src/`)

Multi-page Vite app (`appType: "mpa"`). `vite.config.ts` auto-discovers all `*.html` files under `src/` as entry points. Tailwind CSS 4 via `@tailwindcss/vite` plugin.

- `_public/` — static assets copied to build root (e.g., `robots.txt`).
- `_ui/` — shared styles (`index.css`, `theme.css`, `components.css`) and scripts.

In dev and preview modes, `/api/*` is proxied to `http://127.0.0.1:3001` (backend internal port).

### Ports

| Mode | Frontend port | Backend port |
|------|--------------|-------------|
| Dev | `PORT` (env, default 3000) | 3001 (hardcoded via `cross-env PORT=3001`) |
| Production | `PORT` (env, default 3000) | 3001 (hardcoded) |

The `.env` file lives at the repo root and is loaded by both the backend (`dotenv`) and Vite (`envDir: repoRoot`).
