# Mailer.js

A small mailer app workspace built with TypeScript, Fastify, Vite, Tailwind CSS, and Nodemailer.

The repository is organized as an npm workspace monorepo with:

- `apps/backend` for the Fastify API and production server
- `apps/frontend` for the Vite-powered frontend shell

The app runs in two different modes:

- Development: Vite serves the frontend on the public port and proxies `/api/*` requests to the backend.
- Production: Frontend and backend are deployed independently; the backend exposes only the API under `/api/v1/*`.

## Requirements

- Node.js 24 or newer
- npm
- Access to an SMTP server

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example` and fill in your SMTP settings:

```env
PORT=3000
API_BEARER_TOKEN=change-me
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@example.com
```

`SMTP_USER` and `SMTP_PASS` are optional, but if your SMTP server requires authentication, both must be set.
`API_BEARER_TOKEN` is required and must be sent as a bearer token when calling `POST /api/v1/mail/send`.

## Running

Development:

```bash
npm run dev
```

This starts the full development environment with one public URL. Vite serves the frontend on the `PORT` from `.env` and proxies API requests to the backend running on an internal port.

Production:

```bash
npm run build
npm start
```

`npm run build` builds both frontend and backend artifacts independently. `npm start` runs frontend preview on `PORT` (from `.env`, default `3000`) and proxies `/api/*` to the backend API running internally on `3001`.

If you want to run only one service:

- Backend only: `npm run start:backend`
- Frontend only (preview): `npm run start:frontend`

## Testing

Run all backend tests:

```bash
npm test
```

Run unit tests only:

```bash
npm run test:unit
```

Run integration tests only:

```bash
npm run test:integration
```

Use `npm run test:watch --workspace @mailer/backend` for local watch mode.

Test layout:

- Unit tests live next to the source files they cover under `apps/backend/src/**`.
- Integration tests live in `apps/backend/tests/integration/**`.
- `apps/backend/tests/e2e/**` is reserved for future end-to-end coverage.

## API

Health check:

```http
GET /api/v1/health
```

Send email:

```http
POST /api/v1/mail/send
Content-Type: application/json
Authorization: Bearer your-token
```

Example request body:

```json
{
  "to": "recipient@example.com",
  "subject": "Hello",
  "text": "This is a test email.",
  "html": "<p>This is a test email.</p>"
}
```

Example with `curl`:

```bash
curl -X POST http://localhost:3000/api/v1/mail/send \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"recipient@example.com\",\"subject\":\"Hello\",\"text\":\"This is a test email.\"}"
```

## License

This project is licensed under the MIT License.

See [LICENSE](./LICENSE) for details.
