import { Suspense } from "react";
import { connection } from "next/server";
import { loadGarden, speciesOptions } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { EVERY_DAY, isSpecies } from "@/lib/garden";
import { BackLink } from "@/components/garden-ui";
import { HabitForm } from "@/components/client";
import { createHabit } from "@/app/actions";

export default function NewHabitPage(props: PageProps<"/new">) {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <NewHabit {...props} />
    </Suspense>
  );
}

async function NewHabit({ searchParams }: PageProps<"/new">) {
  await connection();
  const user = await requireUser();
  const g = await loadGarden(user);
  const sp = await searchParams;
  // The landing page's "Start growing" passes ?habit=…&plant=…
  const name = typeof sp.habit === "string" ? sp.habit.slice(0, 60) : "";
  const options = speciesOptions(g.progress);
  const wanted = typeof sp.plant === "string" && isSpecies(sp.plant) && !options.find((o) => o.id === sp.plant)?.locked ? sp.plant : "sunflower";

  return (
    <div className="page">
      <header className="page__head" style={{ alignItems: "center", justifyContent: "flex-start" }}>
        <BackLink href="/" label="Back to today" />
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="t-h1">Plant a habit</h1>
        <p className="t-meta">Every day in a row grows it a little more. Miss a day and the streak needs a rain day to survive.</p>
      </div>
      <HabitForm action={createHabit} species={options} initial={{ name, plantType: wanted, scheduleMask: EVERY_DAY, reminderTime: "" }} submitLabel="Plant it" />
    </div>
  );
}
