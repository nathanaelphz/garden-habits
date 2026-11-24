// Minimal single-user password gate. Works in both proxy.ts and server code
// because it only uses Web Crypto. Replace with Auth.js / Better Auth when you
// want real accounts.

export const SESSION_COOKIE = "garden_session";

export async function expectedSessionToken(): Promise<string> {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret) throw new Error("APP_PASSWORD and SESSION_SECRET must be set");
  const data = new TextEncoder().encode(`${password}:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return safeEqual(token, await expectedSessionToken());
}
