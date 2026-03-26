import type { FastifyPluginAsync } from "fastify";

import type { BuildAppOptions } from "../../app.js";
import { hasValidBearerToken } from "../../modules/auth/index.js";
import { invalidRequest, unauthorized } from "../../modules/errors/index.js";
import type { SendMailInput } from "../../modules/mail/index.js";

type SendMailRequestBody = {
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

function parseSendMailBody(body: unknown): SendMailInput {
  if (!isObject(body)) {
    throw invalidRequest("Request body must be a JSON object");
  }

  if (!isNonEmptyString(body.to)) {
    throw invalidRequest("Field 'to' is required");
  }

  if (!isNonEmptyString(body.subject)) {
    throw invalidRequest("Field 'subject' is required");
  }

  if (!isNonEmptyString(body.text)) {
    throw invalidRequest("Field 'text' is required");
  }

  if (body.from !== undefined && !isNonEmptyString(body.from)) {
    throw invalidRequest("Field 'from' must be a non-empty string when provided");
  }

  if (body.html !== undefined && !isNonEmptyString(body.html)) {
    throw invalidRequest("Field 'html' must be a non-empty string when provided");
  }

  return {
    from: body.from,
    html: body.html,
    subject: body.subject,
    text: body.text,
    to: body.to
  };
}

export function registerMailRoutes(options: BuildAppOptions): FastifyPluginAsync {
  return async (app) => {
    app.post<{ Body: SendMailRequestBody }>("/mail/send", async (request, reply) => {
      if (!hasValidBearerToken(options.authBearerToken, request.headers.authorization)) {
        throw unauthorized();
      }

      const input = parseSendMailBody(request.body);
      const messageId = await options.mail.sendEmail(input);

      return reply.status(200).send({
        message: "Email sent successfully",
        messageId
      });
    });
  };
}
