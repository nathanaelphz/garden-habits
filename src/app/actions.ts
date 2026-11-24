"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { todayInTz } from "@/lib/dates";
import { isPlantType } from "@/lib/plants";
import { getCurrentUser, requireAuth } from "@/lib/session";

/** Returns the habit only if it belongs to the current user and isn't archived. */
async function ownedHabit(habitId: number, userId: number) {
  const [habit] = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId), isNull(habits.archivedAt)));
  return habit;
}

export async function createHabit(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();

  const name = String(formData.get("name") ?? "").trim();
  const plant = String(formData.get("plantType") ?? "fern");
  if (name.length < 1 || name.length > 60) return;

  await db.insert(habits).values({
    userId: user.id,
    name,
    plantType: isPlantType(plant) ? plant : "fern",
  });
  revalidatePath("/");
}

/** Check or un-check today for a habit. */
export async function toggleToday(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const habitId = Number(formData.get("habitId"));
  if (!Number.isInteger(habitId)) return;

  const habit = await ownedHabit(habitId, user.id);
  if (!habit) return;

  const today = todayInTz(user.timezone);
  const inserted = await db
    .insert(habitLogs)
    .values({ habitId, logDate: today })
    .onConflictDoNothing()
    .returning({ id: habitLogs.id });

  // Already done today → this tap means "undo".
  if (inserted.length === 0) {
    await db
      .delete(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.logDate, today)));
  }
  revalidatePath("/");
}

/** Soft-delete: keeps the history so the plant can come back later. */
export async function archiveHabit(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const habitId = Number(formData.get("habitId"));
  if (!Number.isInteger(habitId)) return;

  const habit = await ownedHabit(habitId, user.id);
  if (!habit) return;

  await db.update(habits).set({ archivedAt: new Date() }).where(eq(habits.id, habitId));
  revalidatePath("/");
}
