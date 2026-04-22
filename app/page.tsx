"use client";

import Image from "next/image";
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--home-bg)] text-[var(--home-strong)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-[var(--home-orb-1)] opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-[var(--home-orb-2)] opacity-60 blur-3xl" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,_1.15fr)_minmax(0,_0.85fr)]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--home-muted)]">
                IoT Lighting Research
              </p>
              <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-tight text-[var(--home-strong)] md:text-5xl">
                IoT-Based Light Intensity Monitoring and Smart Control System
              </h1>
              <p className="max-w-2xl text-lg text-[var(--home-text)]">
                A connected lighting platform that measures ambient light, streams
                data in real time, and automates responses through threshold-based
                control. Track energy savings while keeping every workspace perfectly
                lit.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Real-time sensor streaming",
                "ESP32 + Wi-Fi connectivity",
                "Threshold-based automation",
                "Remote web monitoring",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-3 text-sm font-medium text-[var(--home-text)] shadow-[0_16px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <section className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-8 shadow-[0_40px_90px_-60px_rgba(0,0,0,0.65)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--home-muted)]">
                  Access Portal
                </p>
                <h2 className="mt-3 font-[var(--font-display)] text-2xl font-semibold text-[var(--home-strong)]">
                  {mode === "login" ? "Welcome back" : "Create your access"}
                </h2>
              </div>
              <div className="flex rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] p-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)]">
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
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--home-text)]">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-3 text-base text-[var(--home-strong)] shadow-inner outline-none transition focus:border-slate-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--home-text)]">
                Password
                <input
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-3 text-base text-[var(--home-strong)] shadow-inner outline-none transition focus:border-slate-400"
                />
              </label>
              {mode === "register" && (
                <label className="flex flex-col gap-2 text-sm font-medium text-[var(--home-text)]">
                  Confirm password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-3 text-base text-[var(--home-strong)] shadow-inner outline-none transition focus:border-slate-400"
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
              <p className="text-xs text-[var(--home-muted)]">
                By continuing you agree to keep the dashboard credentials private.
              </p>
            </form>
          </section>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8 lg:col-span-2">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                  Introduction
                </p>
                <h2 className="mt-4 font-[var(--font-display)] text-3xl font-semibold text-[var(--home-strong)]">
                  Lighting that reacts, learns, and saves energy.
                </h2>
                <p className="mt-3 text-base text-[var(--home-text)]">
                  Think of the system as a live assistant for your workspace. It senses
                  ambient light, streams measurements over Wi-Fi, and makes decisions in
                  seconds so every room stays efficient and comfortable.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Detects light changes instantly",
                    "Automates LED control with thresholds",
                    "Works across classrooms, labs, and offices",
                    "Reduces waste from manual switching",
                  ].map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-3 text-sm font-medium text-[var(--home-text)]"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    "ESP32 + sensors",
                    "Real-time dashboard",
                    "Energy-aware automation",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--home-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] shadow-[0_30px_70px_-50px_rgba(0,0,0,0.55)] backdrop-blur">
                <div className="relative h-full min-h-[260px] w-full">
                  <Image
                    src="/lighting.jpg"
                    alt="Smart lighting system in action"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                </div>
                <div className="border-t border-[var(--home-card-border)] bg-[var(--home-card)] px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--home-muted)]">
                    Live Environment
                  </p>
                  <p className="mt-2 text-sm text-[var(--home-text)]">
                    Visual context for the lighting spaces monitored by the IoT system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8 lg:col-span-2">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,_0.9fr)_minmax(0,_1.1fr)]">
              <div className="overflow-hidden rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] shadow-[0_24px_60px_-45px_rgba(0,0,0,0.55)]">
                <div className="relative h-full min-h-[220px] w-full">
                  <Image
                    src="/lighting2.jpg"
                    alt="Lighting sensor prototype setup"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 28vw"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                  Specific Objectives
                </p>
                <ul className="mt-5 space-y-3 text-sm text-[var(--home-text)]">
                  {[
                    "Measure ambient light intensity using LDR or BH1750 sensors.",
                    "Process sensor data with an ESP32 microcontroller.",
                    "Transmit real-time readings to the web app over Wi-Fi.",
                    "Design a user-friendly dashboard for monitoring light levels.",
                    "Implement threshold-based automatic LED control.",
                    "Visualize intensity data with charts and status indicators.",
                    "Enable remote monitoring and control through the web interface.",
                    "Improve energy efficiency with data-driven lighting decisions.",
                  ].map((objective) => (
                    <li key={objective} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-[var(--home-strong)]" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Real-time monitoring",
              description:
                "Visualize live light intensity with instant status updates and color-coded indicators.",
            },
            {
              title: "Smart automation",
              description:
                "Threshold rules trigger lighting changes automatically to maintain ideal conditions.",
            },
            {
              title: "Remote control",
              description:
                "Access the system securely from anywhere and keep track of light behavior over time.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.55)] backdrop-blur"
            >
              <h3 className="font-[var(--font-display)] text-xl font-semibold text-[var(--home-strong)]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--home-text)]">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-8 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
              System Materials
            </p>
            <h2 className="font-[var(--font-display)] text-3xl font-semibold text-[var(--home-strong)]">
              Core hardware and platform building blocks
            </h2>
            <p className="max-w-3xl text-sm text-[var(--home-text)]">
              These components power the sensor readings, automation logic, and
              real-time dashboard experience.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Light Sensor (LDR/BH1750)",
                description:
                  "Captures ambient light intensity with reliable accuracy for automation.",
                image: "/LDR Light Sensor.jpg",
              },
              {
                title: "ESP32 Microcontroller",
                description:
                  "Processes sensor data and connects to Wi-Fi for live streaming.",
                image: "/ESP32.jpg",
              },
              {
                title: "LED/Lighting Output",
                description:
                  "Responds to threshold rules to maintain optimal illumination.",
                image: "/LED.jpg",
              },
              {
                title: "Web Dashboard",
                description:
                  "Shows charts, status indicators, and remote control options.",
                image: "/web.jpg",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur"
              >
                <div className="relative h-40 overflow-hidden rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 20vw"
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--home-strong)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--home-text)]">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
