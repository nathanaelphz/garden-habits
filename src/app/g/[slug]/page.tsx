import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { and, eq } from "drizzle-orm";
import { Flame } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loadGarden } from "@/lib/data";
import { DECOR, DECOR_IDS, SPECIES, STAGES, isUnlocked } from "@/lib/garden";
import { GardenScene, Plot } from "@/components/garden-ui";

export default function PublicGardenPage(props: PageProps<"/g/[slug]">) {
  return (
    <Suspense fallback={<div className="page page--wide" aria-busy="true" />}>
      <PublicGarden {...props} />
    </Suspense>
  );
}

async function PublicGarden({ params }: PageProps<"/g/[slug]">) {
  await connection();
  const { slug } = await params;
  const [owner] = await db.select().from(users).where(and(eq(users.publicSlug, slug), eq(users.isPublic, true))).limit(1);
  if (!owner) notFound();
  const g = await loadGarden(owner);
  const decor = DECOR_IDS.filter((d) => isUnlocked(DECOR[d].unlock, g.progress));
  // Visitors never see habit names unless the owner allows it.
  const label = (h: (typeof g.habits)[number]) => (owner.hideNames ? SPECIES[h.species].label : h.name);
  const best = g.habits.reduce((m, h) => Math.max(m, h.state.best), 0);

  return (
    <main style={{ padding: "0 var(--s4) var(--s7)" }}>
      <div className="page page--wide">
        <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 className="t-h1">{owner.name}&rsquo;s garden</h1>
          <p className="t-meta">{g.habits.length} plant{g.habits.length === 1 ? "" : "s"}{owner.showStreaks && best ? ` · best streak ${best} days` : ""}</p>
        </header>
        <div className="scene scene--narrow" style={{ height: 440 }}>
          <GardenScene id="public-n" habits={g.habits} sky={g.sky} decor={decor} height={440} width={360} groundAt={0.8} links={false} label={`${owner.name}'s garden`} />
        </div>
        <div className="scene scene--wide" style={{ height: "min(60vh, 500px)", minHeight: 320 }}>
          <GardenScene id="public-w" habits={g.habits} sky={g.sky} decor={decor} height={500} width={900} groundAt={0.78} links={false} label={`${owner.name}'s garden`} />
        </div>
        <ul className="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--s2)" }}>
          {g.habits.map((h) => (
            <li key={h.id} className="row">
              <Plot species={h.species} stage={h.state.stage} wilt={h.state.doneToday ? 0 : h.state.wiltAmount} size={44} />
              <span className="row__text">
                <span className="row__name">{label(h)}</span>
                <span className="row__meta">
                  {STAGES[h.state.stage]}
                  {owner.showStreaks && h.state.streak > 0 && <><span aria-hidden="true"> · </span><Flame size={14} aria-hidden="true" />{h.state.streak} day streak</>}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="t-meta">A habit tracker where every habit grows a plant. Read-only view.</p>
      </div>
    </main>
  );
}
