"use client";

import { useEffect, useState } from "react";

type LightSnapshot = {
  value: number;
  threshold: number;
  status: "Bright" | "Dark";
  timestamp: string;
};

export default function Home() {
  const [snapshot, setSnapshot] = useState<LightSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSnapshot = async () => {
      try {
        const response = await fetch("/api/light", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load sensor data");
        }
        const data = (await response.json()) as LightSnapshot;
        if (mounted) {
          setSnapshot(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSnapshot();
    const interval = window.setInterval(fetchSnapshot, 2500);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const status = snapshot?.status ?? "--";
  const value = snapshot?.value ?? 0;
  const threshold = snapshot?.threshold ?? 0;
  const updated = snapshot ? new Date(snapshot.timestamp).toLocaleTimeString() : "--";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f7f2,_#f0efe8,_#e7e2d9)] text-zinc-900">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-14">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
            IETP Prototype
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900 md:text-5xl">
            Light sensor simulator
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Phase 1 runs locally in Next.js. The backend generates mock light
            values and the dashboard polls the API every few seconds.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
          <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-400">
                  Latest light level
                </p>
                <div className="mt-4 flex items-end gap-4">
                  <span className="text-6xl font-semibold text-zinc-900">
                    {value.toFixed(1)}
                  </span>
                  <span className="pb-2 text-lg text-zinc-500">%</span>
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  Threshold: {threshold}%
                </p>
              </div>
              <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
                {loading ? "Loading..." : status}
              </div>
            </div>

            <div className="mt-8">
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                <span>Dark</span>
                <span>Bright</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
                System status
              </p>
              <p className="mt-4 text-xl font-semibold text-zinc-900">Mock data</p>
              <p className="mt-2 text-sm text-zinc-600">
                Updated at {updated}
              </p>
              {error && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
            <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
                Next
              </p>
              <p className="mt-4 text-lg text-zinc-700">
                Phase 2: store readings in MongoDB and expose a history API.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
