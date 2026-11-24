import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight, Droplet, Check, Archive } from "lucide-react";
import { loadGarden, speciesOptions } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { addDays } from "@/lib/dates";
import { STAGES, SPECIES, describeSchedule, nextStage, THRESHOLDS } from "@/lib/garden";
import { BackLink, MonthCalendar, Plant, RescueCard, habitLine } from "@/components/garden-ui";
import { HabitForm, SubmitButton } from "@/components/client";
import { archiveHabit, toggleToday, updateHabit } from "@/app/actions";

export default function HabitPage(props: PageProps<"/habits/[id]">) {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <Habit {...props} />
    </Suspense>
  );
}

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

async function Habit({ params, searchParams }: PageProps<"/habits/[id]">) {
  await connection();
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const g = await loadGarden(user);
  const h = g.habits.find((x) => x.id === Number(id));
  if (!h) notFound();
  const s = h.state;

  const thisMonth = g.today.slice(0, 7);
  const m = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) && sp.m <= thisMonth ? sp.m : thisMonth;
  const prev = addDays(`${m}-01`, -1).slice(0, 7);
  const next = addDays(`${m}-01`, 32).slice(0, 7);
  const monthName = new Date(`${m}-15T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  const shown = s.atRisk ?? s.streak;
  const nx = nextStage(shown);
  const stageFloor = THRESHOLDS[s.stage];
  const frac = nx ? (shown - stageFloor) / (THRESHOLDS[s.stage + 1] - stageFloor) : 1;
  const line = habitLine(h);

  return (
    <div className="page">
      <header className="page__head" style={{ alignItems: "center" }}>
        <BackLink href="/" label="Back to today" />
      </header>

      <section aria-labelledby="habit-h" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s3)", textAlign: "center" }}>
        <div style={{ width: "100%", height: 240, borderRadius: 28, display: "flex", alignItems: "flex-end", justifyContent: "center", background: s.wilt === "healthy" || s.doneToday ? "radial-gradient(closest-side at 50% 80%, rgba(44,59,38,0.9), rgba(44,59,38,0))" : "radial-gradient(closest-side at 50% 80%, rgba(58,52,32,0.9), rgba(58,52,32,0))" }}>
          <Plant species={h.species} stage={s.stage} wilt={s.doneToday ? 0 : s.wiltAmount} height={220} grow={s.doneToday} label={`${SPECIES[h.species].label}, ${STAGES[s.stage].toLowerCase()}`} />
        </div>
        <h1 id="habit-h" className="t-h1">{h.name}</h1>
        <p className="t-meta">
          {SPECIES[h.species].label} · {describeSchedule(h.scheduleMask)}{h.reminderTime ? ` · reminder ${fmt12(h.reminderTime)}` : ""}
        </p>
        <p className={`t-meta ${line.tone ?? ""}`} style={{ fontWeight: 600 }}>{line.text}</p>
      </section>

      <form action={toggleToday}>
        <input type="hidden" name="habitId" value={h.id} />
        {s.doneToday ? (
          <SubmitButton className="btn btn--secondary btn--block"><Check size={18} aria-hidden="true" />Watered today · undo</SubmitButton>
        ) : (
          <SubmitButton className="btn btn--primary btn--block"><Droplet size={18} aria-hidden="true" />{s.scheduledToday ? "Water it today" : "Water it anyway"}</SubmitButton>
        )}
      </form>

      <RescueCard h={h} held={g.ledger.held} />

      <section className="card card--pad" aria-label="Streak" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--s3)" }}>
          <div><p className="t-stat tone-amber">{shown}</p><p className="t-meta">{s.atRisk ? "days at risk" : "day streak"}</p></div>
          <div><p className="t-stat">{s.best}</p><p className="t-meta">best streak</p></div>
          <div><p className="t-stat">{s.total}</p><p className="t-meta">check-ins</p></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "var(--t-small)" }}>
            <span style={{ fontWeight: 600 }}>{STAGES[s.stage]}</span>
            <span className="t-meta" style={{ textAlign: "right" }}>{nx ? `${nx.needed} more day${nx.needed === 1 ? "" : "s"} in a row to ${nx.name.toLowerCase()}` : "Fully grown"}</span>
          </div>
          <div className="meter" role="img" aria-label={`${Math.round(frac * 100)}% of the way to the next stage`}><span style={{ width: `${Math.round(frac * 100)}%` }} /></div>
        </div>
      </section>

      <section className="card card--pad" aria-labelledby="cal-h" style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
        <div className="section__head">
          <h2 id="cal-h" className="t-h3">{monthName}</h2>
          <div style={{ display: "flex", gap: 4 }}>
            <Link href={`?m=${prev}`} className="icon-btn" aria-label="Previous month" scroll={false}><ChevronLeft size={18} aria-hidden="true" /></Link>
            {m < thisMonth
              ? <Link href={`?m=${next}`} className="icon-btn" aria-label="Next month" scroll={false}><ChevronRight size={18} aria-hidden="true" /></Link>
              : <span className="icon-btn" aria-hidden="true" style={{ opacity: 0.35 }}><ChevronRight size={18} /></span>}
          </div>
        </div>
        <MonthCalendar month={m} h={h} today={g.today} />
        <p className="t-meta" style={{ display: "flex", gap: "var(--s4)", flexWrap: "wrap" }}>
          <span><span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "var(--amber)", marginRight: 6 }} />Watered</span>
          <span><span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "var(--water)", marginRight: 6 }} />Rain day</span>
          <span><span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, border: "1px dashed #55665a", marginRight: 6 }} />Missed</span>
        </p>
      </section>

      <section className="section" aria-labelledby="edit-h">
        <h2 id="edit-h" className="t-h2">Edit habit</h2>
        <HabitForm
          action={updateHabit}
          species={speciesOptions(g.progress)}
          initial={{ id: h.id, name: h.name, plantType: h.species, scheduleMask: h.scheduleMask, reminderTime: h.reminderTime ?? "" }}
          submitLabel="Save changes"
        />
        <form action={archiveHabit} style={{ marginTop: "var(--s2)" }}>
          <input type="hidden" name="habitId" value={h.id} />
          <button type="submit" className="btn btn--quiet btn--block"><Archive size={17} aria-hidden="true" />Archive this habit</button>
          <p className="field__hint" style={{ textAlign: "center" }}>Its history is kept. You can bring it back from You.</p>
        </form>
      </section>
    </div>
  );
}
