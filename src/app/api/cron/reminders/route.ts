// Sends due reminders as web push notifications.
// Call it every 15 minutes with `Authorization: Bearer <CRON_SECRET>` (see README).
import { eq } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";
import { db } from "@/db";
import { pushSubscriptions, reminderSends, users } from "@/db/schema";
import { safeEqual } from "@/lib/auth";
import { loadGarden } from "@/lib/data";
import { SPECIES } from "@/lib/garden";

const WINDOW_MIN = 60; // a reminder can go out up to an hour late if a cron run was missed

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new Response("Unauthorized", { status: 401 });

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return Response.json({ sent: 0, note: "VAPID keys are not set" });
  setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:garden@example.com", pub, priv);

  let sent = 0;
  for (const user of await db.select().from(users)) {
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id));
    if (!subs.length) continue;
    const g = await loadGarden(user);
    const now = minutes(new Intl.DateTimeFormat("en-GB", { timeZone: user.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()));

    for (const h of g.habits) {
      const s = h.state;
      if (!h.reminderTime || !s.scheduledToday || s.doneToday) continue;
      const due = minutes(h.reminderTime);
      if (now < due || now - due > WINDOW_MIN) continue;
      // Claim today's send first so overlapping runs never double up.
      const claimed = await db.insert(reminderSends).values({ habitId: h.id, sendDate: g.today }).onConflictDoNothing().returning({ id: reminderSends.id });
      if (!claimed.length) continue;

      const plant = SPECIES[h.species].label.toLowerCase();
      const atRisk = s.atRisk && user.thirstyNudge;
      const payload = JSON.stringify({
        title: atRisk ? `Your ${plant} is thirsty` : `Time to water your ${plant}`,
        body: atRisk
          ? `${h.name} today, and use a rain day to keep the ${s.atRisk} day streak.`
          : s.streak > 0 ? `${h.name}. Keep the ${s.streak} day streak going.` : `${h.name}. Water it to start a streak.`,
        url: `/habits/${h.id}`,
        tag: `habit-${h.id}`,
      });
      for (const sub of subs) {
        try {
          await sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 3600 });
          sent++;
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id)); // expired
        }
      }
    }
  }
  return Response.json({ sent });
}
