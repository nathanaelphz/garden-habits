// Server components for the garden. Plant art is rendered to SVG on the server.
import Link from "next/link";
import { CloudRain, Droplet, Flame, Sprout, CircleAlert, ChevronRight } from "lucide-react";
import { plantSVG } from "@/lib/plant-art.js";
import { sceneSVG, plotPositions, type Sky } from "@/lib/scene";
import { STAGES, nextStage, SPECIES, DAY_NAMES, weekday, type DecorId } from "@/lib/garden";
import type { GardenHabit } from "@/lib/data";
import { spendRainDay, toggleToday } from "@/app/actions";
import { WaterButton } from "./client";

/** A plant drawing. `grow` replays the growth animation whenever stage or wilt changes. */
export function Plant({ species, stage, wilt = 0, height, grow = false, label }: { species: string; stage: number; wilt?: number; height: number; grow?: boolean; label?: string }) {
  const svg = plantSVG(species, stage, wilt, { inner: true });
  return (
    <span key={`${stage}:${wilt}`} className={`plant-art${grow ? " grow" : ""}`} style={{ display: "block", width: (height * 120) / 160, height }}>
      <svg viewBox="0 0 120 160" width={(height * 120) / 160} height={height} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: svg }} />
    </span>
  );
}

/** A plant cropped into a round plot, sized to its stage so small plants still read. */
export function Plot({ species, stage, wilt = 0, size = 52, grow = false }: { species: string; stage: number; wilt?: number; size?: number; grow?: boolean }) {
  const tall = [16, 30, 52, 80, 104, 118][stage] + 14;
  const box = Math.max(tall, 44);
  const vb = `${60 - box / 2 + (wilt > 0.4 ? 8 : 0)} ${153 - box} ${box} ${box}`;
  return (
    <span className={`plot${wilt > 0.4 ? " plot--thirsty" : ""}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg key={`${stage}:${wilt}`} className={grow ? "grow" : undefined} viewBox={vb} width={size} height={size} dangerouslySetInnerHTML={{ __html: plantSVG(species, stage, wilt, { inner: true }) }} />
    </span>
  );
}

/** The garden scene; each plant gets an invisible link to its habit. */
export function GardenScene({ id, habits, sky, decor = [], height, width = 400, groundAt, fade, label, links = true, rain, tags = false }: {
  id: string; habits: Pick<GardenHabit, "id" | "name" | "species" | "state">[]; sky: Sky; decor?: DecorId[]; height: number; width?: number;
  groundAt?: number; fade?: boolean; label?: string; links?: boolean; rain?: boolean; tags?: boolean;
}) {
  const xs = plotPositions(habits.length);
  const shrink = habits.length > 6 ? 6 / habits.length : 1;
  const svg = sceneSVG(id, width, height, habits.map((h, i) => ({ species: h.species, stage: h.state.stage, wilt: h.state.doneToday ? 0 : h.state.wiltAmount, x: xs[i], s: shrink })), {
    sky, decor, groundAt, fade, rain, label: label ?? `Your garden: ${habits.length} plant${habits.length === 1 ? "" : "s"}`,
  });
  return (
    <>
      <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
      {links && habits.map((h, i) => (
        <Link key={h.id} href={`/habits/${h.id}`} className="scene__tap" style={{ left: `${xs[i] * 100}%` }} aria-label={`${h.name}: ${SPECIES[h.species].label}, ${STAGES[h.state.stage].toLowerCase()}`}>
          {tags && (
            <span className="scene__tag" aria-hidden="true">
              <span className="scene__tag-name">{h.name}</span>
              <span className={h.state.wilt === "dry" ? "tone-rust" : h.state.wilt === "thirsty" ? "tone-straw" : undefined}>
                {h.state.wilt === "dry" ? "dry" : h.state.wilt === "thirsty" ? "thirsty" : `${h.state.streak}d`}
              </span>
            </span>
          )}
        </Link>
      ))}
    </>
  );
}

type Line = { text: string; tone?: string; icon?: "flame" | "drop" | "sprout" | "alert" };

/** The one line under a habit's name. Words always carry the state, never colour alone. */
export function habitLine(h: GardenHabit): Line {
  const s = h.state;
  if (s.doneToday) {
    if (s.restartedToday) return { text: `Started over · ${s.lost} day streak lost`, tone: "tone-rust", icon: "alert" };
    if (s.grewToday) return { text: `Grew into a ${STAGES[s.stage].toLowerCase()} · ${s.streak} day streak`, tone: "tone-amber", icon: "sprout" };
    return { text: `${STAGES[s.stage]} · ${s.streak} day streak`, icon: "flame" };
  }
  if (s.wilt === "thirsty") return { text: s.atRisk ? `Thirsty · ${s.atRisk} day streak at risk` : "Thirsty · water it today", tone: "tone-straw", icon: "drop" };
  if (s.wilt === "dry") return { text: s.lost ? `Dry · ${s.lost} day streak lost` : "Dry · water it to start a streak", tone: "tone-rust", icon: "alert" };
  if (!s.scheduledToday) return { text: s.streak ? `Rest day · ${s.streak} day streak` : "Rest day" };
  if (s.streak === 0) return { text: "Seed · water it to sprout" };
  const next = nextStage(s.streak);
  return { text: `${STAGES[s.stage]} · ${s.streak} day streak${next ? ` · ${next.needed} to ${next.name.toLowerCase()}` : ""}`, icon: "flame" };
}

function LineIcon({ icon }: { icon?: Line["icon"] }) {
  if (icon === "flame") return <Flame size={15} aria-hidden="true" />;
  if (icon === "drop") return <Droplet size={15} aria-hidden="true" />;
  if (icon === "sprout") return <Sprout size={15} aria-hidden="true" />;
  if (icon === "alert") return <CircleAlert size={15} aria-hidden="true" />;
  return null;
}

export function HabitRow({ h }: { h: GardenHabit }) {
  const s = h.state;
  const line = habitLine(h);
  const tone = s.doneToday ? (s.restartedToday ? "row--lost" : "row--done") : s.wilt === "thirsty" ? "row--thirsty" : s.wilt === "dry" ? "row--lost" : !s.scheduledToday ? "row--rest" : "";
  return (
    <li className={`row ${tone}`}>
      <Link href={`/habits/${h.id}`} className="row__main">
        <Plot species={h.species} stage={s.stage} wilt={s.doneToday ? 0 : s.wiltAmount} grow={s.doneToday} />
        <span className="row__text">
          <span className="row__name">{h.name}</span>
          <span className={`row__meta ${line.tone ?? ""}`}><LineIcon icon={line.icon} />{line.text}</span>
        </span>
      </Link>
      <form action={toggleToday}>
        <input type="hidden" name="habitId" value={h.id} />
        <WaterButton done={s.doneToday} name={h.name} />
      </form>
    </li>
  );
}

/** Thirsty, or restarted today: a rain day can still save the streak. */
export function RescueCard({ h, held }: { h: GardenHabit; held: number }) {
  const s = h.state;
  if (!s.rainable) return null;
  const days = s.atRisk ?? s.lost ?? 0;
  if (!days) return null;
  const day = DAY_NAMES[weekday(s.rainable)];
  const restarted = s.restartedToday;
  return (
    <section className="card card--pad card--thirsty" aria-labelledby={`rescue-${h.id}`} style={{ display: "flex", gap: "var(--s4)", alignItems: "center" }}>
      <div style={{ flex: "none", width: 84, height: 104, borderRadius: 16, background: "radial-gradient(circle at 50% 75%, #3a3420, #1f2117 75%)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <Plant species={h.species} stage={restarted ? 1 : s.stage} wilt={restarted ? 0 : 0.55} height={96} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <h2 id={`rescue-${h.id}`} className="t-h3">{restarted ? `${h.name} started over` : `${h.name}: ${days} day streak at risk`}</h2>
        <p className="t-meta">
          {restarted
            ? `You checked in after missing ${day}, so the streak went back to 1. A rain day can still cover ${day} and give back the ${days} days.`
            : `You missed it on ${day}. Use a rain day to keep the streak, or water today and start again from a sprout.`}
        </p>
        {held > 0 ? (
          <form action={spendRainDay}>
            <input type="hidden" name="habitId" value={h.id} />
            <button type="submit" className="btn btn--water btn--small"><CloudRain size={17} aria-hidden="true" />Use a rain day · {held} left</button>
          </form>
        ) : (
          <p className="t-meta tone-straw">No rain days saved. Seven full days in a row earn one.</p>
        )}
      </div>
    </section>
  );
}

export function RainChip({ held }: { held: number }) {
  return (
    <Link href="/rain" className="chip chip--water" aria-label={`${held} rain day${held === 1 ? "" : "s"} saved`} style={{ minHeight: 44 }}>
      <CloudRain size={17} aria-hidden="true" />{held}
    </Link>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="icon-btn" aria-label={label}>
      <ChevronRight size={20} style={{ transform: "rotate(180deg)" }} aria-hidden="true" />
    </Link>
  );
}

/** Month grid for one habit: done, rain-covered, missed, rest days. */
export function MonthCalendar({ month, h, today }: { month: string; h: GardenHabit; today: string }) {
  const [y, m] = month.split("-").map(Number);
  const first = `${month}-01`;
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = weekday(first);
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(<span key={`e${i}`} aria-hidden="true" />);
  for (let d = 1; d <= daysIn; d++) {
    const day = `${month}-${String(d).padStart(2, "0")}`;
    const before = day < h.hist.startDate, future = day > today;
    const sched = ((h.scheduleMask >> weekday(day)) & 1) === 1;
    const done = h.hist.done.has(day), rain = h.hist.covered.has(day);
    let cls = "cal__day", label = "";
    if (done) { cls += " cal__day--done"; label = "watered"; }
    else if (rain) { cls += " cal__day--rain"; label = "saved by a rain day"; }
    else if (future || before) { cls += " cal__day--future"; label = future ? "upcoming" : "before this habit"; }
    else if (!sched) { cls += " cal__day--rest"; label = "rest day"; }
    else if (day < today) { cls += " cal__day--missed"; label = "missed"; }
    else label = "due today";
    if (day === today) cls += " cal__day--today";
    cells.push(<span key={day} className={cls} role="img" aria-label={`${d}: ${label}`}>{d}</span>);
  }
  return (
    <div className="cal" role="group" aria-label="Month calendar">
      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="cal__dow" aria-hidden="true">{d}</span>)}
      {cells}
    </div>
  );
}
