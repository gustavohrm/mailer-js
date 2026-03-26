import Fastify from "fastify";
import { timingSafeEqual } from "node:crypto";

import { config } from "./config.ts";
import { sendEmail, verifySmtpConnection } from "./email.ts";

type SendEmailRequestBody = {
  from?: unknown;
  html?: unknown;
  subject?: unknown;
  text?: unknown;
  to?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function extractBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}

function tokensMatch(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function parseSendEmailBody(body: unknown) {
  if (!isObject(body)) {
    throw new Error("Request body must be a JSON object");
  }

  if (!isNonEmptyString(body.to)) {
    throw new Error("Field 'to' is required");
  }

  if (!isNonEmptyString(body.subject)) {
    throw new Error("Field 'subject' is required");
  }

  if (!isNonEmptyString(body.text)) {
    throw new Error("Field 'text' is required");
  }

  if (body.from !== undefined && !isNonEmptyString(body.from)) {
    throw new Error("Field 'from' must be a non-empty string when provided");
  }

  if (body.html !== undefined && !isNonEmptyString(body.html)) {
    throw new Error("Field 'html' must be a non-empty string when provided");
  }

  return {
    from: body.from,
    html: body.html,
    subject: body.subject,
    text: body.text,
    to: body.to
  };
}

async function startServer(): Promise<void> {
  await verifySmtpConnection();

  const app = Fastify({
    logger: true
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.post<{ Body: SendEmailRequestBody }>("/send-email", async (request, reply) => {
    const bearerToken = extractBearerToken(request.headers.authorization);

    if (!bearerToken || !tokensMatch(config.auth.bearerToken, bearerToken)) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const input = parseSendEmailBody(request.body);
      const messageId = await sendEmail(input);

      return reply.status(200).send({
        message: "Email sent successfully",
        messageId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const statusCode =
        message === "Request body must be a JSON object" || message.startsWith("Field '") ? 400 : 500;

      return reply.status(statusCode).send({ error: message });
    }
  });

  await app.listen({
    host: "0.0.0.0",
    port: config.port
  });
}

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected startup error";

  console.error(`Failed to start server: ${message}`);
  process.exit(1);
});
