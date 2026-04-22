"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LightSnapshot = {
    value: number;
    threshold: number;
    status: "Bright" | "Dark";
    timestamp: string;
};

type ControlState = {
    threshold: number;
    value: string;
};

export default function LightPage() {
    const router = useRouter();
    const [snapshot, setSnapshot] = useState<LightSnapshot | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [control, setControl] = useState<ControlState>({
        threshold: 40,
        value: "",
    });
    const [thresholdTouched, setThresholdTouched] = useState(false);
    const [controlBusy, setControlBusy] = useState(false);
    const [controlError, setControlError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/me", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Unauthorized");
                }
                const data = (await response.json()) as { user: { email: string } };
                if (mounted) {
                    setUserEmail(data.user.email);
                }
            } catch {
                if (mounted) {
                    router.replace("/");
                }
            } finally {
                if (mounted) {
                    setAuthLoading(false);
                }
            }
        };

        checkAuth();

        return () => {
            mounted = false;
        };
    }, [router]);

    useEffect(() => {
        if (authLoading || !userEmail) {
            return;
        }

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
                    setControl((prev) => ({
                        threshold: thresholdTouched ? prev.threshold : data.threshold,
                        value: prev.value,
                    }));
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
    }, [authLoading, userEmail]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
    };

    const handleControlSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setControlError(null);
        setControlBusy(true);

        const payload: { threshold: number; value?: number } = {
            threshold: control.threshold,
        };

        if (control.value.trim()) {
            const manualValue = Number(control.value);
            if (Number.isFinite(manualValue)) {
                payload.value = manualValue;
            }
        }

        try {
            const response = await fetch("/api/light", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to update the light reading");
            }

            const data = (await response.json()) as LightSnapshot;
            setSnapshot(data);
        } catch (err) {
            setControlError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setControlBusy(false);
        }
    };

    const status = snapshot?.status ?? "--";
    const value = snapshot?.value ?? 0;
    const threshold = snapshot?.threshold ?? 0;
    const updated = snapshot ? new Date(snapshot.timestamp).toLocaleTimeString() : "--";

    const valuePercent = useMemo(
        () => Math.min(100, Math.max(0, value)),
        [value]
    );

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                Checking access...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f6f2ff,_#e8e1ff,_#dcd2f7)] text-slate-900">
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-14">
                <header className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
                            Light Control
                        </p>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span>{userEmail}</span>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                    <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                        Light sensor simulator
                    </h1>
                    <p className="max-w-2xl text-lg text-slate-600">
                        Monitor the latest sensor output and send new thresholds or manual
                        values to test the system response.
                    </p>
                </header>

                <section className="grid gap-6 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
                    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.45)] backdrop-blur">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
                                    Latest light level
                                </p>
                                <div className="mt-4 flex items-end gap-4">
                                    <span className="text-6xl font-semibold text-slate-900">
                                        {value.toFixed(1)}
                                    </span>
                                    <span className="pb-2 text-lg text-slate-500">%</span>
                                </div>
                                <p className="mt-3 text-sm text-slate-500">
                                    Threshold: {threshold}%
                                </p>
                            </div>
                            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                                {loading ? "Loading..." : status}
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-fuchsia-400 to-pink-500 transition-all"
                                    style={{ width: `${valuePercent}%` }}
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                <span>Dark</span>
                                <span>Bright</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                                System status
                            </p>
                            <p className="mt-4 text-xl font-semibold text-slate-900">
                                Mock data stream
                            </p>
                            <p className="mt-2 text-sm text-slate-600">Updated at {updated}</p>
                            {error && (
                                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                    {error}
                                </p>
                            )}
                        </div>
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                                Control desk
                            </p>
                            <form className="mt-4 flex flex-col gap-4" onSubmit={handleControlSubmit}>
                                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                                    Threshold
                                    <div className="mt-2 flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={control.threshold}
                                            onChange={(event) =>
                                                {
                                                    setThresholdTouched(true);
                                                    setControl((prev) => ({
                                                        ...prev,
                                                        threshold: Number(event.target.value),
                                                    }));
                                                }
                                            }
                                            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={control.threshold}
                                            onChange={(event) =>
                                                {
                                                    setThresholdTouched(true);
                                                    setControl((prev) => ({
                                                        ...prev,
                                                        threshold: Number(event.target.value),
                                                    }));
                                                }
                                            }
                                            className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                        />
                                    </div>
                                </label>
                                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                                    Manual value (optional)
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        placeholder="Auto"
                                        value={control.value}
                                        onChange={(event) =>
                                            setControl((prev) => ({ ...prev, value: event.target.value }))
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                    />
                                </label>
                                {controlError && (
                                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                        {controlError}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={controlBusy}
                                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {controlBusy ? "Sending" : "Send update"}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
