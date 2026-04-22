"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/app/components/ToastProvider";

type AuthMode = "login" | "register";

export default function Home() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }

      pushToast(
        mode === "login" ? "Signed in successfully." : "Account created successfully.",
        "success"
      );
      try {
        router.push("/light");
      } catch {
        window.location.assign("/light");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff2d4,_#f5d3a4,_#e8b77b)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_#ffd18a,_#f7b35e)] opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_#ffe9c7,_#f1b56a)] opacity-60 blur-3xl" />
      </div>

      <main className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
        <section className="flex flex-col justify-center gap-8">
          <p className="text-xs uppercase tracking-[0.45em] text-slate-700">
            IETP Prototype
          </p>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
            Secure the lab, then steer the light.
          </h1>
          <p className="max-w-xl text-lg text-slate-700">
            Create an account or sign in to reach the live light control panel.
            Use the dashboard to monitor readings and adjust thresholds in
            real time.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Live sensor snapshots",
              "Manual threshold control",
              "History captured in MongoDB",
              "Session-based access",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm font-medium text-slate-800 shadow-[0_16px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_40px_90px_-60px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Access Portal
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-2xl font-semibold text-slate-900">
                {mode === "login" ? "Welcome back" : "Create your access"}
              </h2>
            </div>
            <div className="flex rounded-full border border-slate-200 bg-white/70 p-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-3 py-2 transition ${mode === "login"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500"
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full px-3 py-2 transition ${mode === "register"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500"
                  }`}
              >
                Register
              </button>
            </div>
          </div>

          <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner outline-none transition focus:border-slate-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner outline-none transition focus:border-slate-400"
              />
            </label>
            {mode === "register" && (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-inner outline-none transition focus:border-slate-400"
                />
              </label>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.8)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Working..." : submitLabel}
            </button>
            <p className="text-xs text-slate-500">
              By continuing you agree to keep the dashboard credentials private.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
