import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { headers } from "next/headers";
import { Download, LogOut, ExternalLink } from "lucide-react";
import { loadGarden } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { Plot } from "@/components/garden-ui";
import { AutoSaveForm, CopyLink, PushToggle, SubmitButton } from "@/components/client";
import { restoreHabit, signOut, updateNudge, updateProfile, updateSharing } from "@/app/actions";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <Settings />
    </Suspense>
  );
}

const SHARE_SWITCHES = [
  { name: "isPublic", label: "Public garden page", hint: "Anyone with the link can look. Nothing can be changed." },
  { name: "hideNames", label: "Hide habit names", hint: "Visitors see plants, not what they are for." },
  { name: "showStreaks", label: "Show streaks", hint: "Each plant shows its current streak." },
] as const;

async function Settings() {
  await connection();
  const user = await requireUser();
  const g = await loadGarden(user);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const shareUrl = user.publicSlug ? `${origin}/g/${user.publicSlug}` : null;
  const zones = Intl.supportedValuesOf("timeZone");

  return (
    <div className="page">
      <header className="page__head"><h1 className="t-h1">You</h1></header>

      <section className="card card--pad" aria-labelledby="profile-h" style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
        <h2 id="profile-h" className="t-h3">Profile</h2>
        <form action={updateProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          <div className="field">
            <label className="field__label" htmlFor="name">Name</label>
            <input id="name" name="name" className="input" defaultValue={user.name} maxLength={40} autoComplete="given-name" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="tz">Time zone</label>
            <select id="tz" name="timezone" className="input" defaultValue={user.timezone}>
              {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
            </select>
            <p className="field__hint">Decides when your day starts and ends.</p>
          </div>
          <SubmitButton className="btn btn--secondary" pendingLabel="Saving">Save profile</SubmitButton>
        </form>
      </section>

      <section className="card card--pad" aria-labelledby="remind-h" style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
        <h2 id="remind-h" className="t-h3">Reminders</h2>
        <PushToggle vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
        <hr className="rule" />
        <AutoSaveForm action={updateNudge} className="switch-row">
          <div>
            <label htmlFor="nudge" style={{ fontWeight: 600, display: "block" }}>Thirsty plant nudge</label>
            <p className="t-meta">When a streak is at risk, the reminder says so.</p>
          </div>
          <input id="nudge" type="checkbox" role="switch" name="thirstyNudge" className="switch" defaultChecked={user.thirstyNudge} />
        </AutoSaveForm>
        <p className="t-meta">Set each habit&rsquo;s reminder time on its page.</p>
      </section>

      <section id="share" className="card card--pad" aria-labelledby="share-h" style={{ display: "flex", flexDirection: "column", gap: "var(--s2)", scrollMarginTop: 24 }}>
        <h2 id="share-h" className="t-h3">Share your garden</h2>
        <AutoSaveForm action={updateSharing} style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
          {SHARE_SWITCHES.map((s) => (
            <div key={s.name} className="switch-row">
              <div>
                <label htmlFor={`s-${s.name}`} style={{ fontWeight: 600, display: "block" }}>{s.label}</label>
                <p className="t-meta">{s.hint}</p>
              </div>
              <input id={`s-${s.name}`} type="checkbox" role="switch" name={s.name} className="switch" defaultChecked={user[s.name]} />
            </div>
          ))}
        </AutoSaveForm>
        {user.isPublic && shareUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "var(--s2)" }}>
            <p className="t-meta" style={{ wordBreak: "break-all" }}>{shareUrl}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <CopyLink url={shareUrl} />
              <Link href={`/g/${user.publicSlug}`} className="btn btn--quiet btn--small" target="_blank"><ExternalLink size={16} aria-hidden="true" />Open it</Link>
            </div>
          </div>
        )}
      </section>

      {g.archived.length > 0 && (
        <section className="section" aria-labelledby="arch-h">
          <h2 id="arch-h" className="t-h3">Archived habits</h2>
          <ul className="list">
            {g.archived.map((a) => (
              <li key={a.id} className="row row--rest">
                <Plot species={a.species} stage={a.state.stage} size={40} />
                <span className="row__text" style={{ flex: 1 }}><span className="row__name">{a.name}</span><span className="row__meta">Best streak {a.state.best} days</span></span>
                <form action={restoreHabit}><input type="hidden" name="habitId" value={a.id} /><SubmitButton className="btn btn--secondary btn--small">Restore</SubmitButton></form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section" aria-label="Your data" style={{ flexDirection: "row", flexWrap: "wrap", gap: "var(--s2)" }}>
        <a href="/export" className="btn btn--secondary btn--small"><Download size={16} aria-hidden="true" />Export check-ins (CSV)</a>
        <form action={signOut}><button type="submit" className="btn btn--quiet btn--small"><LogOut size={16} aria-hidden="true" />Sign out</button></form>
      </section>
    </div>
  );
}
