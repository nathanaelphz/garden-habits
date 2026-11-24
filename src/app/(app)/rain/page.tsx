import { Suspense } from "react";
import { connection } from "next/server";
import { Cloud, CloudRain, Droplet, Plus } from "lucide-react";
import { loadGarden, longDate } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { RAIN_MAX, RAIN_RUN } from "@/lib/garden";
import { BackLink, RescueCard } from "@/components/garden-ui";

export default function RainPage() {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <Rain />
    </Suspense>
  );
}

async function Rain() {
  await connection();
  const user = await requireUser();
  const g = await loadGarden(user);
  const { held, progress, events } = g.ledger;
  const names = new Map([...g.habits, ...g.archived].map((h) => [h.id, h.name]));
  const rescuable = g.habits.filter((h) => h.state.rainable && (h.state.atRisk || h.state.lost));

  return (
    <div className="page">
      <header className="page__head" style={{ alignItems: "center", justifyContent: "flex-start" }}>
        <BackLink href="/" label="Back to today" />
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="t-h1">Rain days</h1>
        <p className="t-meta">A rain day waters a habit you missed yesterday, so its streak survives. It never adds a check-in.</p>
      </div>

      <ul className="list" aria-label={`${held} of ${RAIN_MAX} rain days saved`} style={{ display: "grid", gridTemplateColumns: `repeat(${RAIN_MAX}, minmax(0, 1fr))`, gap: "var(--s3)" }}>
        {Array.from({ length: RAIN_MAX }, (_, i) => {
          const full = i < held;
          return (
            <li key={i} style={{ height: 112, borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
              background: full ? "var(--water-soft)" : "transparent", border: full ? "1px solid var(--water-line)" : "1px dashed var(--line-strong)" }}>
              {full ? <CloudRain size={34} strokeWidth={1.6} aria-hidden="true" className="tone-water" /> : <Cloud size={34} strokeWidth={1.6} aria-hidden="true" style={{ color: "#5c6c60" }} />}
              <span style={{ fontSize: "var(--t-small)", fontWeight: 600, color: full ? "var(--water)" : "var(--faint)" }}>{full ? "Saved" : "Empty"}</span>
            </li>
          );
        })}
      </ul>

      <section className="card card--pad" aria-labelledby="next-h" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h2 id="next-h" className="t-h3" style={{ fontSize: "var(--t-body)" }}>Next rain day</h2>
          <span className="t-meta nums">{held >= RAIN_MAX ? "Full" : `${progress} of ${RAIN_RUN} days`}</span>
        </div>
        <div className="meter meter--water" role="img" aria-label={`${progress} of ${RAIN_RUN} full days`}><span style={{ width: `${(held >= RAIN_MAX ? 1 : progress / RAIN_RUN) * 100}%` }} /></div>
        <p className="t-meta">Earn one for every {RAIN_RUN} days in a row with every habit watered. You can hold up to {RAIN_MAX}.</p>
      </section>

      {rescuable.map((h) => <RescueCard key={h.id} h={h} held={held} />)}

      <section className="section" aria-labelledby="hist-h">
        <h2 id="hist-h" className="t-h2">History</h2>
        {events.length === 0 ? (
          <p className="t-meta">Nothing yet. Your first rain day arrives after {RAIN_RUN} full days.</p>
        ) : (
          <ul className="list" style={{ gap: 0 }}>
            {events.slice(0, 30).map((e, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 52, borderBottom: "1px solid var(--line)" }}>
                {e.kind === "used" ? <Droplet size={18} aria-hidden="true" className="tone-water" /> : <Plus size={18} aria-hidden="true" className="tone-amber" />}
                <span style={{ flex: 1 }}>{e.kind === "used" ? <>Used <span className="t-faint">· {names.get(e.habitId ?? 0) ?? "an archived habit"}</span></> : <>Earned <span className="t-faint">· {RAIN_RUN} full days</span></>}</span>
                <time className="t-meta" dateTime={e.day}>{longDate(e.day).replace(/^\w+, /, "")}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
