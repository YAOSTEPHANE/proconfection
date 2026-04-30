import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const encoder = new TextEncoder();

export const AUTH_COOKIE_NAME = "admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8h

type SessionPayload = {
  email: string;
  exp: number;
};

function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "admin@proconfection.com").trim().toLowerCase();
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "ProConfection2026";
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-admin-session-secret-change-me";
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(unsignedToken: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(unsignedToken)
    .digest("base64url");
}

function safeCompare(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function isValidAdminCredentials(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    safeCompare(normalizedEmail, getAdminEmail()) &&
    safeCompare(password, getAdminPassword())
  );
}

export function createSignedSessionToken(email: string): string {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export function verifySignedSessionToken(token: string | undefined): boolean {
  if (!token || !token.includes(".")) {
    return false;
  }

  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return false;
  }

  const expectedSignature = sign(payloadEncoded);
  if (!safeCompare(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as SessionPayload;
    if (!payload.email || typeof payload.exp !== "number") {
      return false;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return false;
    }
    return payload.email === getAdminEmail();
  } catch {
    return false;
  }
}

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return verifySignedSessionToken(token);
}
