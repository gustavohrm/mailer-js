import { describe, expect, it } from "vitest";

import { hasValidBearerToken } from "./index.js";

describe("hasValidBearerToken", () => {
  it("returns true for a matching bearer token", () => {
    expect(hasValidBearerToken("secret-token", "Bearer secret-token")).toBe(true);
  });

  it("returns false when the authorization header is missing", () => {
    expect(hasValidBearerToken("secret-token", undefined)).toBe(false);
  });

  it("returns false for non-bearer schemes", () => {
    expect(hasValidBearerToken("secret-token", "Basic secret-token")).toBe(false);
  });

  it("returns false when the token is missing from the header", () => {
    expect(hasValidBearerToken("secret-token", "Bearer")).toBe(false);
  });

  it("returns false when the token does not match exactly", () => {
    expect(hasValidBearerToken("secret-token", "Bearer secret-token-2")).toBe(false);
  });
});
