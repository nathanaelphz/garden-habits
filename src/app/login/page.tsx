import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sprout } from "lucide-react";
import { expectedSessionToken, safeEqual, SESSION_COOKIE } from "@/lib/auth";

/** Only same-site paths, never "//evil.com". */
const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/");

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const expected = process.env.APP_PASSWORD;
  if (!expected || !safeEqual(password, expected)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  (await cookies()).set(SESSION_COOKIE, await expectedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  redirect(next);
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--s5)" }}>
      <form action={login} className="card" style={{ width: "100%", maxWidth: 360, padding: "var(--s6) var(--s5)", display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Sprout size={32} aria-hidden="true" className="tone-amber" />
          <h1 className="t-h2">Garden</h1>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="password">Password</label>
          <Suspense fallback={<input id="password" type="password" name="password" className="input" autoComplete="current-password" />}>
            <PasswordField searchParams={searchParams} />
          </Suspense>
        </div>
        <button type="submit" className="btn btn--primary btn--block">Open my garden</button>
      </form>
    </main>
  );
}

async function PasswordField({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error, next } = await searchParams;
  return (
    <>
      <input id="password" type="password" name="password" className="input" required autoFocus autoComplete="current-password"
        aria-invalid={error ? true : undefined} aria-describedby={error ? "pw-error" : undefined} />
      <input type="hidden" name="next" value={safeNext(next)} />
      {error && <p id="pw-error" className="field__error" role="alert">That password didn&rsquo;t match. Try again.</p>}
    </>
  );
}
