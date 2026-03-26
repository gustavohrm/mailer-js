import test from "node:test";
import assert from "node:assert/strict";

import { buildApp } from "../dist/app.js";
import { mailSendFailed } from "../dist/modules/errors/index.js";

function createMailModule(overrides = {}) {
  return {
    async sendEmail(_input) {
      return "message-123";
    },
    async verifyConnection() {},
    ...overrides
  };
}

test("returns 401 with a structured error when the bearer token is missing", async () => {
  const app = buildApp({
    authBearerToken: "secret-token",
    mail: createMailModule()
  });

  app.log.level = "silent";

  const response = await app.inject({
    method: "POST",
    payload: {
      subject: "Hello",
      text: "Body",
      to: "recipient@example.com"
    },
    url: "/api/v1/mail/send"
  });

  await app.close();

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), {
    error: {
      code: "UNAUTHORIZED",
      message: "Unauthorized"
    }
  });
});

test("returns 400 with INVALID_REQUEST when the body is invalid", async () => {
  const app = buildApp({
    authBearerToken: "secret-token",
    mail: createMailModule()
  });

  app.log.level = "silent";

  const response = await app.inject({
    headers: {
      authorization: "Bearer secret-token"
    },
    method: "POST",
    payload: {
      subject: "Hello",
      to: "recipient@example.com"
    },
    url: "/api/v1/mail/send"
  });

  await app.close();

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), {
    error: {
      code: "INVALID_REQUEST",
      message: "Field 'text' is required"
    }
  });
});

test("returns 503 with a safe message when mail sending fails", async () => {
  const app = buildApp({
    authBearerToken: "secret-token",
    mail: createMailModule({
      async sendEmail() {
        throw mailSendFailed(new Error("smtp auth failed for user real-user@example.com"));
      }
    })
  });

  app.log.level = "silent";

  const response = await app.inject({
    headers: {
      authorization: "Bearer secret-token"
    },
    method: "POST",
    payload: {
      subject: "Hello",
      text: "Body",
      to: "recipient@example.com"
    },
    url: "/api/v1/mail/send"
  });

  await app.close();

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), {
    error: {
      code: "MAIL_SEND_FAILED",
      message: "Unable to send email right now."
    }
  });
  assert.equal(response.body.includes("real-user@example.com"), false);
});

test("returns 500 with a generic error when an unexpected error is thrown", async () => {
  const app = buildApp({
    authBearerToken: "secret-token",
    mail: createMailModule({
      async sendEmail() {
        throw new Error("unexpected smtp failure");
      }
    })
  });

  app.log.level = "silent";

  const response = await app.inject({
    headers: {
      authorization: "Bearer secret-token"
    },
    method: "POST",
    payload: {
      subject: "Hello",
      text: "Body",
      to: "recipient@example.com"
    },
    url: "/api/v1/mail/send"
  });

  await app.close();

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json(), {
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error"
    }
  });
  assert.equal(response.body.includes("unexpected smtp failure"), false);
});

test("keeps the success payload unchanged", async () => {
  const app = buildApp({
    authBearerToken: "secret-token",
    mail: createMailModule({
      async sendEmail() {
        return "message-456";
      }
    })
  });

  app.log.level = "silent";

  const response = await app.inject({
    headers: {
      authorization: "Bearer secret-token"
    },
    method: "POST",
    payload: {
      subject: "Hello",
      text: "Body",
      to: "recipient@example.com"
    },
    url: "/api/v1/mail/send"
  });

  await app.close();

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    message: "Email sent successfully",
    messageId: "message-456"
  });
});
