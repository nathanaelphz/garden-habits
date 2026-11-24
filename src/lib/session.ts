import "server-only";
import { cookies } from "next/headers";
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

/**
 * Week 1 is single-user: the first row in `users` is you.
 * It's created on first visit from APP_USER_NAME / APP_TIMEZONE.
 */
export async function getCurrentUser() {
  const [existing] = await db.select().from(users).orderBy(users.id).limit(1);
  const tzEnv = process.env.APP_TIMEZONE ?? "UTC";
  const timezone = isValidTimezone(tzEnv) ? tzEnv : "UTC";

  if (!existing) {
    const [created] = await db
      .insert(users)
      .values({ name: process.env.APP_USER_NAME ?? "Me", timezone })
      .returning();
    return created;
  }
  // Keep the stored time zone in sync with the env var.
  if (existing.timezone !== timezone) {
    await db.update(users).set({ timezone }).where(eq(users.id, existing.id));
    return { ...existing, timezone };
  }
  return existing;
}
