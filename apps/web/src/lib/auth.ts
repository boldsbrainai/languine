import "server-only";
import { timingSafeEqual } from "node:crypto";

const HEADER_NAME = "x-api-key";
const OWNER_TOKEN_HEADER_NAME = "x-languine-owner-token";

let warnedMissingKey = false;

function hasMatchingSecret(
  candidate: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!candidate || !expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function getExpectedApiKey(): string | null {
  const key = process.env.LANGUINE_API_KEY;
  if (!key) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        "[languine] LANGUINE_API_KEY is not set. All API requests will be rejected. Generate one (e.g. `openssl rand -hex 32`) and set it in the app environment.",
      );
    }
    return null;
  }
  return key;
}

export function isValidApiKey(candidate: string | null | undefined): boolean {
  return hasMatchingSecret(candidate, getExpectedApiKey());
}

export function readApiKeyFromHeaders(headers: Headers): string | null {
  return headers.get(HEADER_NAME);
}

function readOwnerTokenFromHeaders(headers: Headers): string | null {
  const explicitToken = headers.get(OWNER_TOKEN_HEADER_NAME);
  if (explicitToken) return explicitToken;

  const authorization = headers.get("authorization");
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function isLocalDevelopmentRequest(headers: Headers): boolean {
  if (process.env.NODE_ENV !== "development") return false;

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return false;

  const hostname = host.split(":")[0]?.toLowerCase();
  return Boolean(
    hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname?.endsWith(".localhost"),
  );
}

/**
 * Returns true when the request carries the deployment's explicit admin token.
 * In local development we stay permissive to keep setup friction low.
 */
export function isOwnerRequest(headers: Headers): boolean {
  if (isLocalDevelopmentRequest(headers)) return true;

  return hasMatchingSecret(
    readOwnerTokenFromHeaders(headers),
    process.env.LANGUINE_ADMIN_TOKEN,
  );
}

export function requireApiKey(headers: Headers): void {
  const candidate = readApiKeyFromHeaders(headers);
  if (!isValidApiKey(candidate)) {
    throw new ApiKeyError();
  }
}

export class ApiKeyError extends Error {
  readonly status = 401;
  constructor() {
    super("Invalid or missing API key");
  }
}
