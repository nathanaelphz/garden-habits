import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Lock } from "lucide-react";
import { loadGarden } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { SPECIES, SPECIES_IDS, describeUnlock, isUnlocked, unlockProgress } from "@/lib/garden";
import { Plant, Plot } from "@/components/garden-ui";

export default function SeedsPage() {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <Seeds />
    </Suspense>
  );
}

async function Seeds() {
  await connection();
  const user = await requireUser();
  const g = await loadGarden(user);
  const owned = SPECIES_IDS.filter((id) => isUnlocked(SPECIES[id].unlock, g.progress)).length;

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="t-h1">Seeds</h1>
          <p className="t-meta">{owned} of {SPECIES_IDS.length} plants unlocked. Rare seeds come from long streaks and many check-ins.</p>
        </div>
      </header>

      <ul className="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(156px, 1fr))", gap: "var(--s3)" }}>
        {SPECIES_IDS.map((id) => {
          const sp = SPECIES[id];
          const open = isUnlocked(sp.unlock, g.progress);
          const p = unlockProgress(sp.unlock, g.progress);
          const using = g.habits.filter((h) => h.species === id);
          const night = id === "moonflower";
          return (
            <li key={id} className="card" style={{ padding: "var(--s3)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ position: "relative", height: 150, borderRadius: 14, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden",
                background: night ? "radial-gradient(circle at 50% 66%, #2B3060, #111A2C 74%)" : "radial-gradient(circle at 50% 72%, #2A3D2F, #17241C 72%)" }}>
                <span style={{ filter: open ? undefined : "brightness(0) opacity(0.45)" }}><Plant species={id} stage={4} height={130} label={open ? `${sp.label} in bloom` : undefined} /></span>
                {!open && <Lock size={16} aria-label="Locked" style={{ position: "absolute", top: 10, right: 10, color: "var(--soft)" }} />}
              </div>
              <h2 className="t-h3" style={{ fontSize: "var(--t-lead)" }}>{sp.label}</h2>
              <p className="t-meta">{open ? (using.length ? `Growing: ${using.map((h) => h.name).join(", ")}` : sp.unlock.kind === "starter" ? "Starter seed" : "Unlocked") : describeUnlock(sp.unlock)}</p>
              {!open && p && (
                <>
                  <div className="meter" role="img" aria-label={`${p.have} of ${p.need}`}><span style={{ width: `${(p.have / p.need) * 100}%` }} /></div>
                  <p className="t-label nums">{p.have} of {p.need}{sp.unlock.kind === "streak" ? " days (best streak)" : " check-ins"}</p>
                </>
              )}
              {open && using.length === 0 && <Link href={`/new?plant=${id}`} className="link">Plant one</Link>}
            </li>
          );
        })}
      </ul>

      <section className="section" aria-labelledby="stages-h">
        <h2 id="stages-h" className="t-h2">How plants grow</h2>
        <p className="t-meta">A plant&rsquo;s size is its current streak. Miss a day and it waits, thirsty, for a rain day. Miss two, or water it without one, and it starts again from a sprout.</p>
        <ol className="list" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 6 }}>
          {([["Seed", 0], ["Sprout", 1], ["Seedling", 3], ["Bud", 7], ["Bloom", 14], ["Mature", 30]] as const).map(([name, n], i) => (
            <li key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
              <Plot species="sunflower" stage={i} size={46} />
              <span className="t-label" style={{ color: "var(--ink)" }}>{name}</span>
              <span className="t-label nums">{n === 0 ? "start" : `${n} day${n === 1 ? "" : "s"}`}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
