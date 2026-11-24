import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { expectedSessionToken, safeEqual, SESSION_COOKIE } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const expected = process.env.APP_PASSWORD;
  if (!expected || !safeEqual(password, expected)) {
    redirect("/login?error=1");
  }
  (await cookies()).set(SESSION_COOKIE, await expectedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  redirect("/");
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form action={login} className="w-full max-w-xs space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-semibold">🌱 Garden</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoFocus
          className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-green-600"
        />
        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>
        <button className="w-full rounded-lg bg-green-700 py-2 font-medium text-white hover:bg-green-800">
          Enter
        </button>
      </form>
    </main>
  );
}

async function LoginError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  return error ? <p className="text-sm text-red-600">Wrong password.</p> : null;
}
