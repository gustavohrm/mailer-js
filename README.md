# Mailer.js

A simple Node.js mailer service built with TypeScript, Fastify, and Nodemailer.

It starts an HTTP server and exposes a `POST /send-email` endpoint that sends emails through an SMTP server.

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
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@example.com
```

`SMTP_USER` and `SMTP_PASS` are optional, but if your SMTP server requires authentication, both must be set.

## Running

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

`npm start` builds the project and runs the compiled server from `dist/`.

## API

Health check:

```http
GET /health
```

Send email:

```http
POST /send-email
Content-Type: application/json
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
curl -X POST http://localhost:3000/send-email \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"recipient@example.com\",\"subject\":\"Hello\",\"text\":\"This is a test email.\"}"
```

## License

This project is licensed under the MIT License.

See [LICENSE](./LICENSE) for details.
