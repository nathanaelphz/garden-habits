import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, Plus, Sun, CloudSun, Cloud, CloudRain, Sprout } from "lucide-react";
import { loadGarden, greeting, longDate } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { DECOR, DECOR_IDS, STAGES, isUnlocked, nextStage } from "@/lib/garden";
import { GardenScene, HabitRow, Plot, RainChip, RescueCard } from "@/components/garden-ui";

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <Today />
    </Suspense>
  );
}

function TodaySkeleton() {
  return (
    <div className="page" aria-busy="true">
      <div style={{ height: 70 }} />
      <div className="scene scene--label" style={{ height: 176, opacity: 0.4 }} />
      <ul className="list">{[0, 1, 2].map((i) => <li key={i} className="row" style={{ height: 78, opacity: 0.35 }} />)}</ul>
    </div>
  );
}

const WEATHER_ICON = { sunny: Sun, bright: CloudSun, cloudy: Cloud, rainy: CloudRain, new: Sprout };

async function Today() {
  await connection();
  const user = await requireUser();
  const g = await loadGarden(user);
  const decor = DECOR_IDS.filter((d) => isUnlocked(DECOR[d].unlock, g.progress));

  const due = g.habits.filter((h) => h.state.scheduledToday || h.state.doneToday);
  const resting = g.habits.filter((h) => !h.state.scheduledToday && !h.state.doneToday);
  // Order: at risk first, then still to water, then done.
  const rank = (h: (typeof due)[number]) => (h.state.doneToday ? 3 : h.state.wilt === "thirsty" ? 0 : h.state.wilt === "dry" ? 1 : 2);
  due.sort((a, b) => rank(a) - rank(b));
  const doneCount = due.filter((h) => h.state.doneToday).length;
  const rescues = g.habits.filter((h) => h.state.rainable && (h.state.atRisk || (h.state.restartedToday && h.state.lost)));
  const away = g.habits.length > 0 && g.habits.every((h) => h.state.missed >= 3 && !h.state.doneToday);
  const WeatherIcon = WEATHER_ICON[g.weather.kind];

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="t-h1">{greeting(g.hour, user.name)}</h1>
          <p className="t-meta"><time dateTime={g.today}>{longDate(g.today)}</time></p>
        </div>
        <RainChip held={g.ledger.held} />
      </header>

      {g.habits.length === 0 ? (
        <section className="card" aria-labelledby="empty-h" style={{ overflow: "hidden" }}>
          <div className="scene" style={{ height: 200, borderRadius: 0, border: 0 }}>
            <GardenScene id="empty" habits={[]} sky={g.sky} height={200} links={false} label="An empty garden bed" />
          </div>
          <div style={{ padding: "var(--s5)", display: "flex", flexDirection: "column", gap: "var(--s3)", alignItems: "flex-start" }}>
            <h2 id="empty-h" className="t-h2">Plant your first habit</h2>
            <p className="t-meta">Pick one small thing you can do every day. Each day in a row grows its plant: a sprout on day 1, a bud by day 7, in bloom by day 14.</p>
            <Link href="/new" className="btn btn--primary"><Plus size={18} aria-hidden="true" />Plant a habit</Link>
          </div>
        </section>
      ) : (
        <>
          <Link href="/garden" className="scene scene--label" style={{ height: 176, display: "block", textDecoration: "none" }} aria-label={`Open your garden. ${doneCount} of ${due.length} watered today.`}>
            <GardenScene id="peek" habits={g.habits} sky={g.sky} decor={decor} height={176} fade links={false} />
            <span className="scene__over">
              <span>
                <span className="t-meta" style={{ display: "block", color: "var(--ink)" }}>Watered today</span>
                <span className="t-stat" style={{ fontSize: 28 }}>{doneCount} of {due.length}</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 600, fontSize: "var(--t-small)" }}>Garden<ChevronRight size={18} aria-hidden="true" /></span>
            </span>
          </Link>
          <p className="t-meta" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: "calc(var(--s2) * -1)" }}>
            <WeatherIcon size={17} aria-hidden="true" className={g.weather.kind === "rainy" ? "tone-water" : "tone-amber"} />
            <span><strong style={{ color: "var(--ink)", fontWeight: 600 }}>{g.weather.label}.</strong> {g.weather.detail}</span>
          </p>
        </>
      )}

      {away && (
        <section className="card card--pad" aria-labelledby="away-h" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 id="away-h" className="t-h3">Your garden waited for you</h2>
          <p className="t-meta">It has been a few days, so the streaks have ended. Water a plant today to start its next one. Your best streaks are still on record.</p>
        </section>
      )}

      {rescues.map((h) => <RescueCard key={h.id} h={h} held={g.ledger.held} />)}

      {g.habits.filter((h) => h.state.grewToday).map((h) => {
        const next = nextStage(h.state.streak);
        return (
          <Link key={`grew-${h.id}`} href={`/habits/${h.id}`} className="card card--pad grew" aria-label={`${h.name} grew into a ${STAGES[h.state.stage].toLowerCase()}`}>
            <Plot species={h.species} stage={h.state.stage} size={76} grow />
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="t-h3">{h.name} grew into a {STAGES[h.state.stage].toLowerCase()}</span>
              <span className="t-meta">{h.state.streak} days in a row.{next ? ` ${next.needed} more to ${next.name.toLowerCase()}.` : " Fully grown."}</span>
            </span>
          </Link>
        );
      })}

      {g.habits.length > 0 && (
        <section className="section" aria-labelledby="today-h">
          <div className="section__head">
            <h2 id="today-h" className="t-h2">Today</h2>
            <Link href="/new" className="link"><Plus size={18} aria-hidden="true" />New habit</Link>
          </div>
          {due.length > 0 ? (
            <ul className="list">{due.map((h) => <HabitRow key={h.id} h={h} />)}</ul>
          ) : (
            <p className="t-meta">Nothing is due today. Enjoy the rest day.</p>
          )}
        </section>
      )}

      {resting.length > 0 && (
        <section className="section" aria-labelledby="rest-h">
          <h2 id="rest-h" className="t-h3" style={{ color: "var(--soft)" }}>Resting today</h2>
          <ul className="list">{resting.map((h) => <HabitRow key={h.id} h={h} />)}</ul>
        </section>
      )}
    </div>
  );
}
