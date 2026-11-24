import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Trophy } from "lucide-react";
import { loadGarden } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { addDays } from "@/lib/dates";
import { DAY_NAMES, isScheduled, rangeStats, weekday } from "@/lib/garden";
import { Plot } from "@/components/garden-ui";

export default function StatsPage(props: PageProps<"/stats">) {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <Stats {...props} />
    </Suspense>
  );
}

const RANGES = { week: "This week", month: "This month", all: "All time" } as const;
type Range = keyof typeof RANGES;

async function Stats({ searchParams }: PageProps<"/stats">) {
  await connection();
  const user = await requireUser();
  const g = await loadGarden(user);
  const sp = await searchParams;
  const range: Range = sp.r === "week" || sp.r === "all" ? sp.r : "month";
  const all = [...g.habits, ...g.archived];
  const start = all.reduce((m, h) => (h.hist.startDate < m ? h.hist.startDate : m), g.today);
  const from = range === "week" ? addDays(g.today, -weekday(g.today)) : range === "month" ? `${g.today.slice(0, 8)}01` : start;
  const st = rangeStats(g.habits.map((h) => h.hist), from, g.today);
  const pct = Math.round(st.rate * 100);
  const best = [...all].sort((a, b) => b.state.best - a.state.best)[0];

  // Daily record for the range: kept / due across active habits.
  const days: { day: string; due: number; kept: number }[] = [];
  const heatFrom = range === "all" ? addDays(g.today, -83) : from;
  for (let d = heatFrom < start ? start : heatFrom; d <= g.today; d = addDays(d, 1)) {
    let due = 0, kept = 0;
    for (const h of g.habits) {
      if (d < h.hist.startDate || !isScheduled(h.scheduleMask, d)) continue;
      due++;
      if (h.hist.done.has(d) || h.hist.covered.has(d)) kept++;
    }
    days.push({ day: d, due, kept });
  }
  const lead = days.length ? weekday(days[0].day) : 0;
  // Weekday pattern uses finished days only: today is still in progress.
  const past = rangeStats(g.habits.map((h) => h.hist), from, addDays(g.today, -1));
  const weakest = past.byWeekday.map((w, i) => ({ i, due: w.due, r: w.due ? w.kept / w.due : 1 })).filter((w) => w.due).sort((a, b) => a.r - b.r)[0];

  return (
    <div className="page">
      <header className="page__head" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <h1 className="t-h1">Stats</h1>
        <nav aria-label="Range" style={{ display: "flex", padding: 4, borderRadius: 999, background: "var(--surface)", border: "1px solid var(--line)" }}>
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <Link key={r} href={`?r=${r}`} scroll={false} aria-current={r === range ? "page" : undefined}
              style={{ minHeight: 40, padding: "0 14px", display: "flex", alignItems: "center", borderRadius: 999, textDecoration: "none", fontSize: "var(--t-small)", fontWeight: 600, background: r === range ? "var(--raised)" : "transparent", color: r === range ? "var(--ink)" : "var(--soft)" }}>
              {r === "all" ? "All" : r[0].toUpperCase() + r.slice(1)}
            </Link>
          ))}
        </nav>
      </header>

      {g.habits.length === 0 ? (
        <p className="t-meta">Stats appear after your first check-in. <Link href="/new" className="link" style={{ minHeight: 0 }}>Plant a habit</Link></p>
      ) : (
        <>
          <section className="card card--pad" aria-labelledby="kept-h" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
            <h2 id="kept-h" className="t-h3">{RANGES[range]}: {st.kept} of {st.due} kept <span className="t-faint" style={{ fontWeight: 500 }}>({pct}%)</span></h2>
            <div className="cal" role="img" aria-label={`Daily record: ${days.filter((d) => d.due && d.kept === d.due).length} full days out of ${days.filter((d) => d.due).length}`}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="cal__dow">{d}</span>)}
              {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
              {days.map((d) => {
                const f = d.due ? d.kept / d.due : -1;
                // partial days: amber outline with ink text (fills under ink failed contrast)
                const style = f === 1 ? { background: "var(--amber)", color: "var(--amber-ink)" } : f > 0 ? { boxShadow: "inset 0 0 0 2px var(--amber)" } : undefined;
                return <span key={d.day} className={`cal__day${f === 0 && d.day < g.today ? " cal__day--missed" : ""}${d.day === g.today ? " cal__day--today" : ""}`} style={style}>{Number(d.day.slice(8))}</span>;
              })}
            </div>
            <p className="t-meta">Solid amber: every habit kept that day. Outlined: some kept. Dashed: none.</p>
          </section>

          <section className="section" aria-labelledby="each-h">
            <h2 id="each-h" className="t-h2">Each habit</h2>
            <ul className="list">
              {g.habits.map((h) => {
                const s = st.per.get(h.id) ?? { due: 0, kept: 0 };
                const r = s.due ? s.kept / s.due : 0;
                return (
                  <li key={h.id} className="row">
                    <Plot species={h.species} stage={h.state.stage} wilt={h.state.doneToday ? 0 : h.state.wiltAmount} size={44} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span className="row__name">{h.name}</span>
                        <span className="t-meta nums">{s.kept}/{s.due}</span>
                      </div>
                      <div className="meter" role="img" aria-label={`${Math.round(r * 100)}% kept`}><span style={{ width: `${Math.round(r * 100)}%` }} /></div>
                      <span className="t-meta">Best streak {h.state.best} · now {h.state.streak}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card card--pad" aria-labelledby="wd-h" style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <h2 id="wd-h" className="t-h3">By day of the week</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }} role="img" aria-label={past.byWeekday.map((w, i) => `${DAY_NAMES[i]} ${w.kept} of ${w.due}`).join(", ")}>
              {past.byWeekday.map((w, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", height: `${Math.max(4, (w.due ? w.kept / w.due : 0) * 92)}px`, borderRadius: 6, background: w.due && w.kept === w.due ? "var(--amber)" : "#8A7140" }} />
                  <span className="t-label">{DAY_NAMES[i].slice(0, 2)}</span>
                  <span className="t-faint nums" style={{ fontSize: "0.75rem" }}>{w.due ? `${Math.round((w.kept / w.due) * 100)}%` : "–"}</span>
                </div>
              ))}
            </div>
            {weakest && weakest.r < 1 && <p className="t-meta">{DAY_NAMES[weakest.i]}s are your thirstiest day.</p>}
          </section>

          {best && best.state.best > 0 && (
            <section className="card card--pad" style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }} aria-label="Longest streak">
              <Trophy size={24} aria-hidden="true" className="tone-amber" />
              <p><strong>Longest streak: {best.state.best} days</strong><br /><span className="t-meta">{best.name}{best.state.streak === best.state.best ? ", still going" : ""}</span></p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
