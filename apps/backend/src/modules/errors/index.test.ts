import { describe, expect, it } from "vitest";

import { AppError, internalError, invalidRequest, isAppError, mailSendFailed, unauthorized } from "./index.js";

describe("AppError helpers", () => {
  it("creates invalid request errors with an exposed 400 response", () => {
    const error = invalidRequest("Field 'text' is required");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      code: "INVALID_REQUEST",
      expose: true,
      message: "Field 'text' is required",
      name: "AppError",
      statusCode: 400,
    });
    expect(isAppError(error)).toBe(true);
  });

  it("creates unauthorized errors with the default message", () => {
    const error = unauthorized();

    expect(error).toMatchObject({
      code: "UNAUTHORIZED",
      expose: true,
      message: "Unauthorized",
      statusCode: 401,
    });
  });

  it("allows overriding the unauthorized message", () => {
    const error = unauthorized("Missing bearer token");

    expect(error.message).toBe("Missing bearer token");
  });

  it("wraps mail failures as exposed 503 errors", () => {
    const cause = new Error("smtp auth failed");
    const error = mailSendFailed(cause);

    expect(error).toMatchObject({
      cause,
      code: "MAIL_SEND_FAILED",
      expose: true,
      message: "Unable to send email right now.",
      statusCode: 503,
    });
  });

  it("creates internal errors with the original cause", () => {
    const cause = new Error("unexpected failure");
    const error = internalError(cause);

    expect(error).toMatchObject({
      cause,
      code: "INTERNAL_ERROR",
      expose: true,
      message: "Internal server error",
      statusCode: 500,
    });
  });

  it("returns false for non AppError values", () => {
    expect(isAppError(new Error("plain error"))).toBe(false);
    expect(isAppError("error")).toBe(false);
  });
});
