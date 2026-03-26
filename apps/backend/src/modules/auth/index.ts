import { timingSafeEqual } from "node:crypto";

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

export function hasValidBearerToken(expectedToken: string, authorizationHeader: string | undefined): boolean {
  const receivedToken = extractBearerToken(authorizationHeader);

  return receivedToken !== undefined && tokensMatch(expectedToken, receivedToken);
}
