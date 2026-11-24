import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // IANA time zone, e.g. "Asia/Kuala_Lumpur". Decides what "today" means.
  timezone: text("timezone").notNull().default("UTC"),
  // Sharing: a read-only public garden at /g/<slug>.
  publicSlug: text("public_slug").unique(),
  isPublic: boolean("is_public").notNull().default(false),
  hideNames: boolean("hide_names").notNull().default(true),
  showStreaks: boolean("show_streaks").notNull().default(true),
  // A second nudge when a plant is thirsty.
  thirstyNudge: boolean("thirsty_nudge").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const habits = pgTable(
  "habits",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    plantType: text("plant_type").notNull().default("fern"),
    // Bit per weekday, Monday = bit 0. 127 = every day.
    scheduleMask: integer("schedule_mask").notNull().default(127),
    // Local "HH:MM", or null for no reminder.
    reminderTime: text("reminder_time"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [index("habits_user_idx").on(t.userId)],
);

// Event log: one row per habit per completed day.
// Streaks, growth, wilting and rain days are computed from this, never stored.
export const habitLogs = pgTable(
  "habit_logs",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    // The user's LOCAL calendar date, not a UTC timestamp.
    logDate: date("log_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("habit_logs_habit_date_uq").on(t.habitId, t.logDate)],
);

// A rain day spent on a missed day. Earned rain days are computed, not stored.
export const rainDayUses = pgTable(
  "rain_day_uses",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    coveredDate: date("covered_date", { mode: "string" }).notNull(),
    usedOn: date("used_on", { mode: "string" }).notNull(),
  },
  (t) => [uniqueIndex("rain_day_uses_habit_date_uq").on(t.habitId, t.coveredDate)],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One reminder per habit per local day, so a cron that runs often never repeats itself.
export const reminderSends = pgTable(
  "reminder_sends",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    sendDate: date("send_date", { mode: "string" }).notNull(),
  },
  (t) => [uniqueIndex("reminder_sends_habit_date_uq").on(t.habitId, t.sendDate)],
);

export type User = typeof users.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
