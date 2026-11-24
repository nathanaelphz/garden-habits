CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "rain_day_uses" (
	"id" serial PRIMARY KEY NOT NULL,
	"habit_id" integer NOT NULL,
	"covered_date" date NOT NULL,
	"used_on" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"habit_id" integer NOT NULL,
	"send_date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "schedule_mask" integer DEFAULT 127 NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "reminder_time" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_slug" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hide_names" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_streaks" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "thirsty_nudge" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rain_day_uses" ADD CONSTRAINT "rain_day_uses_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_sends" ADD CONSTRAINT "reminder_sends_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rain_day_uses_habit_date_uq" ON "rain_day_uses" USING btree ("habit_id","covered_date");--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_sends_habit_date_uq" ON "reminder_sends" USING btree ("habit_id","send_date");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_public_slug_unique" UNIQUE("public_slug");