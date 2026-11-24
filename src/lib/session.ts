import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isValidSession, SESSION_COOKIE } from "./auth";
import { isValidTimezone } from "./dates";

/** Throws unless the request carries a valid session. Call in every Server Action. */
export async function requireAuth() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(token))) throw new Error("Not signed in");
}

/** True when the request carries a valid session. */
export async function isSignedIn() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return isValidSession(token);
}

/**
 * Single-user: the first row in `users` is you. It's created on first visit
 * from APP_USER_NAME / APP_TIMEZONE; after that, Settings owns name and time zone.
 */
export async function getCurrentUser() {
  const [existing] = await db.select().from(users).orderBy(users.id).limit(1);
  if (existing) return existing;
  const tzEnv = process.env.APP_TIMEZONE ?? "UTC";
  const [created] = await db
    .insert(users)
    .values({ name: process.env.APP_USER_NAME ?? "Me", timezone: isValidTimezone(tzEnv) ? tzEnv : "UTC" })
    .returning();
  return created;
}

/** For signed-in pages: redirects to login otherwise. */
export async function requireUser() {
  if (!(await isSignedIn())) redirect("/login");
  return getCurrentUser();
}

export async function updateUser(id: number, patch: Partial<typeof users.$inferInsert>) {
  await db.update(users).set(patch).where(eq(users.id, id));
}
