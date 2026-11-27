"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Droplet, House, Flower2, ChartColumn, Sprout, User, Bell, BellOff, Copy, Lock, CloudRain } from "lucide-react";
import type { HabitFormState } from "@/app/actions";
import { savePushSubscription, removePushSubscription } from "@/app/actions";

// ------------------------------------------------------------ navigation
const TABS = [
  { href: "/", label: "Today", Icon: House },
  { href: "/garden", label: "Garden", Icon: Flower2 },
  { href: "/stats", label: "Stats", Icon: ChartColumn },
  { href: "/seeds", label: "Seeds", Icon: Sprout },
  { href: "/settings", label: "You", Icon: User },
];

export function TabBar() {
  return <TabLinks path={usePathname()} />;
}

/** The nav itself; also the static fallback (no current tab) while the path streams in. */
export function TabLinks({ path }: { path: string }) {
  // Highlight the tapped tab immediately, before the next page has arrived from the server.
  const [tapped, setTapped] = useState<string | null>(null);
  useEffect(() => setTapped(null), [path]);
  const at = tapped ?? path;
  const current = (href: string) => (href === "/" ? at === "/" || at.startsWith("/habits") || at === "/new" : at.startsWith(href));
  return (
    <nav className="tabbar" aria-label="Main">
      <span className="tabbar__brand"><Sprout size={22} aria-hidden="true" />Garden</span>
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} onClick={() => setTapped(href)} aria-current={current(href) ? "page" : undefined}>
          <Icon size={22} strokeWidth={current(href) ? 2.2 : 1.8} aria-hidden="true" />
          {label}
        </Link>
      ))}
      <Link href="/rain" className="tabbar__extra" onClick={() => setTapped("/rain")} aria-current={at.startsWith("/rain") ? "page" : undefined}>
        <CloudRain size={22} aria-hidden="true" />Rain days
      </Link>
    </nav>
  );
}

// ------------------------------------------------------------ check-in
export function WaterButton({ done, name }: { done: boolean; name: string }) {
  const { pending } = useFormStatus();
  // Show the new state the moment it's tapped; the server answers with the grown plant.
  const shown = pending ? !done : done;
  return (
    <button type="submit" className="water" aria-pressed={shown} data-pending={pending} aria-label={shown ? `Undo ${name} for today` : `Water ${name}`}>
      {shown ? <Check size={22} strokeWidth={2.6} aria-hidden="true" /> : <Droplet size={21} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}

export function SubmitButton({ children, className = "btn btn--primary btn--block", pendingLabel }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

// ------------------------------------------------------------ habit form
export type SpeciesOption = { id: string; label: string; svg: string; locked: string | null };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function HabitForm({ action, species, initial, submitLabel }: {
  action: (prev: HabitFormState, data: FormData) => Promise<HabitFormState>;
  species: SpeciesOption[];
  initial: { id?: number; name: string; plantType: string; scheduleMask: number; reminderTime: string };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, { errors: {} });
  const e = state.errors;
  return (
    <form action={formAction} noValidate style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
      {initial.id && <input type="hidden" name="habitId" value={initial.id} />}
      <div className="field">
        <label className="field__label" htmlFor="habit-name">Habit</label>
        <input id="habit-name" name="name" className="input" defaultValue={state.values?.name ?? initial.name} maxLength={60} autoComplete="off"
          placeholder="Read 20 min" aria-invalid={e.name ? true : undefined} aria-describedby={e.name ? "habit-name-error" : undefined} />
        {e.name && <p id="habit-name-error" className="field__error">{e.name}</p>}
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="field">
        <legend className="field__label" style={{ marginBottom: 8 }}>Its plant</legend>
        <div className="species-pick">
          {species.map((s) => (
            <label key={s.id}>
              <input type="radio" name="plantType" value={s.id} defaultChecked={(state.values?.plantType ?? initial.plantType) === s.id} disabled={!!s.locked} />
              <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: s.svg }} style={{ display: "block", width: 48, height: 64 }} />
              <span className="name">{s.label}</span>
              {s.locked && <span className="lock"><Lock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> {s.locked}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="field">
        <legend className="field__label" style={{ marginBottom: 8 }}>Days</legend>
        <div className="choices choices--days" aria-describedby={e.days ? "days-error" : "days-hint"}>
          {DAYS.map((d, i) => (
            <label key={d} className="choice">
              <input type="checkbox" name="days" value={i} defaultChecked={((initial.scheduleMask >> i) & 1) === 1} aria-label={d} />
              <span aria-hidden="true">{d.slice(0, 2)}</span>
            </label>
          ))}
        </div>
        {e.days ? <p id="days-error" className="field__error">{e.days}</p> : <p id="days-hint" className="field__hint">Days off never count against your streak.</p>}
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor="habit-time">Reminder</label>
        <input id="habit-time" type="time" name="reminderTime" className="input" defaultValue={initial.reminderTime} style={{ maxWidth: 200 }} aria-describedby="habit-time-hint" />
        <p id="habit-time-hint" className="field__hint">Leave empty for no reminder. Turn on notifications in You.</p>
      </div>

      {e.form && <p className="field__error" role="alert">{e.form}</p>}
      <SubmitButton pendingLabel="Saving">{submitLabel}</SubmitButton>
    </form>
  );
}

// ------------------------------------------------------------ reminders
function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushToggle({ vapidKey }: { vapidKey: string | null }) {
  const [status, setStatus] = useState<"loading" | "unsupported" | "off" | "on" | "blocked" | "nokey">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!vapidKey) return setStatus("nokey");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setStatus("unsupported");
      if (Notification.permission === "denied") return setStatus("blocked");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    })().catch(() => setStatus("unsupported"));
  }, [vapidKey]);

  async function turnOn() {
    if (!vapidKey) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus(perm === "denied" ? "blocked" : "off"); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
      await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      setStatus("on");
    } finally { setBusy(false); }
  }
  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await removePushSubscription(sub.endpoint); await sub.unsubscribe(); }
      setStatus("off");
    } finally { setBusy(false); }
  }

  const note = {
    loading: "Checking this device…",
    unsupported: "This browser can't show notifications. On iPhone, add Garden to your home screen first.",
    blocked: "Notifications are blocked for this site. Allow them in your browser settings.",
    nokey: "Reminders aren't available on this server yet.",
    off: "Reminders arrive at each habit's time, only if it isn't watered yet.",
    on: "This device gets your reminders.",
  }[status];

  return (
    <div className="switch-row">
      {status === "on" ? <Bell size={20} aria-hidden="true" className="tone-amber" /> : <BellOff size={20} aria-hidden="true" className="t-faint" />}
      <div><p style={{ fontWeight: 600 }}>Notifications on this device</p><p className="t-meta" role="status">{note}</p></div>
      {(status === "on" || status === "off") && (
        <button type="button" className="btn btn--secondary btn--small" onClick={status === "on" ? turnOff : turnOn} disabled={busy}>
          {status === "on" ? "Turn off" : "Turn on"}
        </button>
      )}
    </div>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="btn btn--secondary btn--small" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard refused: the link is on screen */ }
    }}>
      <Copy size={16} aria-hidden="true" />{copied ? "Copied" : "Copy link"}
    </button>
  );
}


/** A form that saves itself whenever one of its controls changes (settings switches). */
export function AutoSaveForm({ action, children, className, style }: {
  action: (formData: FormData) => void | Promise<void>; children: ReactNode; className?: string; style?: CSSProperties;
}) {
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [pending, start] = useTransition();
  return (
    <form
      action={action}
      className={className}
      style={style}
      onChange={(ev) => {
        const form = ev.currentTarget;
        setSaved("saving");
        start(async () => { await action(new FormData(form)); setSaved("saved"); });
      }}
    >
      {children}
      <span className="t-faint" role="status" aria-live="polite" style={{ fontSize: "0.75rem", minHeight: "1em" }}>
        {pending || saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : ""}
      </span>
    </form>
  );
}
