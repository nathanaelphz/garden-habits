"use server";

import { and, eq, isNull, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { habitLogs, habits, pushSubscriptions, rainDayUses } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth";
import { loadGarden } from "@/lib/data";
import { isValidTimezone, todayInTz } from "@/lib/dates";
import { isSpecies, isUnlocked, SPECIES } from "@/lib/garden";
import { getCurrentUser, requireAuth, updateUser } from "@/lib/session";

const refresh = () => revalidatePath("/", "layout");

/** The habit, only if it belongs to the current user. */
async function ownedHabit(habitId: number, userId: number, { archived = false } = {}) {
  const [habit] = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId), archived ? isNotNull(habits.archivedAt) : isNull(habits.archivedAt)));
  return habit;
}

const idFrom = (formData: FormData) => {
  const id = Number(formData.get("habitId"));
  return Number.isInteger(id) && id > 0 ? id : null;
};

// ------------------------------------------------------------ check-in
/** Water (or un-water) today. */
export async function toggleToday(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const habitId = idFrom(formData);
  if (!habitId || !(await ownedHabit(habitId, user.id))) return;

  const today = todayInTz(user.timezone);
  const inserted = await db.insert(habitLogs).values({ habitId, logDate: today }).onConflictDoNothing().returning({ id: habitLogs.id });
  if (inserted.length === 0) {
    await db.delete(habitLogs).where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.logDate, today)));
  }
  refresh();
}

/** Spend a rain day on the one missed day that is still rescuable. */
export async function spendRainDay(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const habitId = idFrom(formData);
  if (!habitId) return;
  const g = await loadGarden(user);
  const h = g.habits.find((x) => x.id === habitId);
  if (!h || !h.state.rainable || g.ledger.held < 1) return;
  await db.insert(rainDayUses).values({ habitId, coveredDate: h.state.rainable, usedOn: g.today }).onConflictDoNothing();
  refresh();
}

// ------------------------------------------------------------ habits
export type HabitFormState = {
  errors: { name?: string; days?: string; form?: string };
  values?: { name: string; plantType: string };
};

async function readHabitForm(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const plantType = String(formData.get("plantType") ?? "");
  const days = formData.getAll("days").map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const time = String(formData.get("reminderTime") ?? "").trim();
  const errors: HabitFormState["errors"] = {};

  if (!name) errors.name = "Give the habit a name, like Read 20 min.";
  else if (name.length > 60) errors.name = "Keep the name under 60 characters.";
  if (days.length === 0) errors.days = "Pick at least one day.";

  let species = isSpecies(plantType) ? plantType : "sunflower";
  if (isSpecies(plantType)) {
    const g = await loadGarden(user);
    if (!isUnlocked(SPECIES[plantType].unlock, g.progress)) species = "sunflower";
  }
  const reminderTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : null;
  const scheduleMask = days.reduce((m, d) => m | (1 << d), 0);
  return { user, errors, data: { name, plantType: species, scheduleMask, reminderTime } };
}

export async function createHabit(_prev: HabitFormState, formData: FormData): Promise<HabitFormState> {
  await requireAuth();
  const { user, errors, data } = await readHabitForm(formData);
  if (Object.keys(errors).length) return { errors, values: { name: data.name, plantType: data.plantType } };
  await db.insert(habits).values({ userId: user.id, ...data });
  refresh();
  redirect("/");
}

export async function updateHabit(_prev: HabitFormState, formData: FormData): Promise<HabitFormState> {
  await requireAuth();
  const habitId = idFrom(formData);
  const { user, errors, data } = await readHabitForm(formData);
  if (!habitId || !(await ownedHabit(habitId, user.id))) return { errors: { form: "That habit no longer exists." } };
  if (Object.keys(errors).length) return { errors, values: { name: data.name, plantType: data.plantType } };
  await db.update(habits).set(data).where(eq(habits.id, habitId));
  refresh();
  redirect(`/habits/${habitId}`);
}

/** Soft-delete: history stays, and it can be restored from You. */
export async function archiveHabit(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const habitId = idFrom(formData);
  if (!habitId || !(await ownedHabit(habitId, user.id))) return;
  await db.update(habits).set({ archivedAt: new Date() }).where(eq(habits.id, habitId));
  refresh();
  redirect("/");
}

export async function restoreHabit(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const habitId = idFrom(formData);
  if (!habitId || !(await ownedHabit(habitId, user.id, { archived: true }))) return;
  await db.update(habits).set({ archivedAt: null }).where(eq(habits.id, habitId));
  refresh();
}

// ------------------------------------------------------------ settings
export async function updateProfile(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const timezone = String(formData.get("timezone") ?? "");
  await updateUser(user.id, {
    ...(name ? { name } : {}),
    ...(isValidTimezone(timezone) ? { timezone } : {}),
  });
  refresh();
}

export async function updateSharing(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  const base = (user.name || "garden").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "garden";
  const slug = user.publicSlug ?? `${base}-${Math.random().toString(36).slice(2, 6)}`;
  await updateUser(user.id, {
    isPublic: formData.get("isPublic") === "on",
    publicSlug: slug,
    hideNames: formData.get("hideNames") === "on",
    showStreaks: formData.get("showStreaks") === "on",
  });
  refresh();
}

export async function updateNudge(formData: FormData) {
  await requireAuth();
  const user = await getCurrentUser();
  await updateUser(user.id, { thirstyNudge: formData.get("thirstyNudge") === "on" });
  refresh();
}

type PushJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function savePushSubscription(sub: PushJSON) {
  await requireAuth();
  const user = await getCurrentUser();
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys.auth) return;
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, userId: user.id } });
}

export async function removePushSubscription(endpoint: string) {
  await requireAuth();
  if (typeof endpoint !== "string") return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
