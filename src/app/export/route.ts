import { loadGarden } from "@/lib/data";
import { getCurrentUser, isSignedIn } from "@/lib/session";

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** All check-ins and rain days as CSV. */
export async function GET() {
  if (!(await isSignedIn())) return new Response("Sign in first", { status: 401 });
  const g = await loadGarden(await getCurrentUser());
  const rows: string[][] = [];
  for (const h of [...g.habits, ...g.archived]) {
    for (const d of h.hist.done) rows.push([d, h.name, h.species, "check-in"]);
    for (const d of h.hist.covered) rows.push([d, h.name, h.species, "rain day"]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  const csv = ["date,habit,plant,kind", ...rows.map((r) => r.map(cell).join(","))].join("\n") + "\n";
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="garden-${g.today}.csv"` },
  });
}
