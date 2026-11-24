import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Share2, Lock, Lamp, Armchair, Wind, Footprints } from "lucide-react";
import { loadGarden } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { DECOR, DECOR_IDS, STAGES, describeUnlock, isUnlocked, unlockProgress } from "@/lib/garden";
import { GardenScene, Plot, habitLine } from "@/components/garden-ui";

export default function GardenPage() {
  return (
    <Suspense fallback={<div className="page page--wide" aria-busy="true"><div className="scene" style={{ height: 460, opacity: 0.4 }} /></div>}>
      <Garden />
    </Suspense>
  );
}

const DECOR_ICON = { lantern: Lamp, path: Footprints, bench: Armchair, chime: Wind };

async function Garden() {
  await connection();
  const user = await requireUser();
  const g = await loadGarden(user);
  const decor = DECOR_IDS.filter((d) => isUnlocked(DECOR[d].unlock, g.progress));
  const blooming = g.habits.filter((h) => h.state.stage >= 4).length;
  const thirsty = g.habits.filter((h) => !h.state.doneToday && h.state.wilt === "thirsty").length;
  const dry = g.habits.filter((h) => !h.state.doneToday && h.state.wilt === "dry").length;

  return (
    <div className="page page--wide">
      <header className="page__head" style={{ alignItems: "center" }}>
        <div>
          <h1 className="t-h1">Your garden</h1>
          <p className="t-meta">
            {g.habits.length} plant{g.habits.length === 1 ? "" : "s"} · {blooming} in bloom{thirsty ? ` · ${thirsty} thirsty` : ""}{dry ? ` · ${dry} dry` : ""}
          </p>
        </div>
        <Link href="/settings#share" className="btn btn--secondary btn--small"><Share2 size={17} aria-hidden="true" />Share</Link>
      </header>

      {/* Two compositions: a tall one for phones, a wide one for larger screens. */}
      <div className="scene scene--narrow" style={{ height: 460 }}>
        <GardenScene id="garden-n" habits={g.habits} sky={g.sky} decor={decor} height={460} width={360} groundAt={0.8} />
      </div>
      <div className="scene scene--wide" style={{ height: "min(62vh, 520px)", minHeight: 360 }}>
        <GardenScene id="garden-w" habits={g.habits} sky={g.sky} decor={decor} height={520} width={900} groundAt={0.78} tags />
      </div>
      <p className="t-meta" style={{ marginTop: "calc(var(--s3) * -1)" }}>Tap a plant to open its habit. The sky follows the time where you are.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "var(--s5)", alignItems: "start" }}>
        <section className="section" aria-labelledby="plants-h" style={{ marginTop: 0 }}>
          <h2 id="plants-h" className="t-h2">Plants</h2>
          {g.habits.length === 0 ? (
            <p className="t-meta">No plants yet. <Link href="/new" className="link" style={{ minHeight: 0 }}>Plant a habit</Link></p>
          ) : (
            <ul className="list">
              {g.habits.map((h) => {
                const line = habitLine(h);
                return (
                  <li key={h.id}>
                    <Link href={`/habits/${h.id}`} className="row" style={{ textDecoration: "none" }}>
                      <Plot species={h.species} stage={h.state.stage} wilt={h.state.doneToday ? 0 : h.state.wiltAmount} size={44} />
                      <span className="row__text" style={{ flex: 1 }}>
                        <span className="row__name">{h.name}</span>
                        <span className={`row__meta ${line.tone ?? ""}`}>{STAGES[h.state.stage]} · best {h.state.best} days</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="section" aria-labelledby="decor-h" style={{ marginTop: 0 }}>
          <h2 id="decor-h" className="t-h2">Decorations</h2>
          <ul className="list">
            {DECOR_IDS.map((d) => {
              const on = decor.includes(d);
              const Icon = DECOR_ICON[d];
              const p = unlockProgress(DECOR[d].unlock, g.progress);
              return (
                <li key={d} className="row" style={{ minHeight: 64 }}>
                  <Icon size={22} aria-hidden="true" className={on ? "tone-amber" : "t-faint"} style={{ marginLeft: 4 }} />
                  <span className="row__text" style={{ flex: 1 }}>
                    <span className="row__name">{DECOR[d].label}</span>
                    <span className="row__meta">{on ? "In your garden" : `${describeUnlock(DECOR[d].unlock)}${p ? ` · ${p.have} of ${p.need}` : ""}`}</span>
                  </span>
                  {!on && <Lock size={16} aria-label="Locked" className="t-faint" style={{ marginRight: 8 }} />}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
