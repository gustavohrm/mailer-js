import { describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { mailSendFailed } from "../../src/modules/errors/index.js";

function createMailModule(overrides = {}) {
  return {
    async sendEmail(_input: unknown) {
      return "message-123";
    },
    async verifyConnection() {},
    ...overrides,
  };
}

describe("POST /api/v1/mail/send", () => {
  it("returns 401 with a structured error when the bearer token is missing", async () => {
    const app = buildApp({
      authBearerToken: "secret-token",
      mail: createMailModule(),
    });

    app.log.level = "silent";

    const response = await app.inject({
      method: "POST",
      payload: {
        subject: "Hello",
        text: "Body",
        to: "recipient@example.com",
      },
      url: "/api/v1/mail/send",
    });

    await app.close();

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
    });
  });

  it("returns 400 with INVALID_REQUEST when the body is invalid", async () => {
    const app = buildApp({
      authBearerToken: "secret-token",
      mail: createMailModule(),
    });

    app.log.level = "silent";

    const response = await app.inject({
      headers: {
        authorization: "Bearer secret-token",
      },
      method: "POST",
      payload: {
        subject: "Hello",
        to: "recipient@example.com",
      },
      url: "/api/v1/mail/send",
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Field 'text' is required",
      },
    });
  });

  it("returns 503 with a safe message when mail sending fails", async () => {
    const app = buildApp({
      authBearerToken: "secret-token",
      mail: createMailModule({
        async sendEmail() {
          throw mailSendFailed(new Error("smtp auth failed for user real-user@example.com"));
        },
      }),
    });

    app.log.level = "silent";

    const response = await app.inject({
      headers: {
        authorization: "Bearer secret-token",
      },
      method: "POST",
      payload: {
        subject: "Hello",
        text: "Body",
        to: "recipient@example.com",
      },
      url: "/api/v1/mail/send",
    });

    await app.close();

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: {
        code: "MAIL_SEND_FAILED",
        message: "Unable to send email right now.",
      },
    });
    expect(response.body.includes("real-user@example.com")).toBe(false);
  });

  it("returns 500 with a generic error when an unexpected error is thrown", async () => {
    const app = buildApp({
      authBearerToken: "secret-token",
      mail: createMailModule({
        async sendEmail() {
          throw new Error("unexpected smtp failure");
        },
      }),
    });

    app.log.level = "silent";

    const response = await app.inject({
      headers: {
        authorization: "Bearer secret-token",
      },
      method: "POST",
      payload: {
        subject: "Hello",
        text: "Body",
        to: "recipient@example.com",
      },
      url: "/api/v1/mail/send",
    });

    await app.close();

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    });
    expect(response.body.includes("unexpected smtp failure")).toBe(false);
  });

  it("keeps the success payload unchanged", async () => {
    const app = buildApp({
      authBearerToken: "secret-token",
      mail: createMailModule({
        async sendEmail() {
          return "message-456";
        },
      }),
    });

    app.log.level = "silent";

    const response = await app.inject({
      headers: {
        authorization: "Bearer secret-token",
      },
      method: "POST",
      payload: {
        subject: "Hello",
        text: "Body",
        to: "recipient@example.com",
      },
      url: "/api/v1/mail/send",
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: "Email sent successfully",
      messageId: "message-456",
    });
  });
});
