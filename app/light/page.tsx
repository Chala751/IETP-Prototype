"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    const [thresholdUpdating, setThresholdUpdating] = useState(false);
    const [controlError, setControlError] = useState<string | null>(null);
    const thresholdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    useEffect(() => {
        return () => {
            if (thresholdTimerRef.current) {
                window.clearTimeout(thresholdTimerRef.current);
            }
        };
    }, []);

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

    const submitThresholdUpdate = async (nextThreshold: number) => {
        setControlError(null);
        setThresholdUpdating(true);

        try {
            const response = await fetch("/api/light", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threshold: nextThreshold }),
            });

            if (!response.ok) {
                throw new Error("Failed to update the threshold");
            }

            const data = (await response.json()) as LightSnapshot;
            setSnapshot(data);
        } catch (err) {
            setControlError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setThresholdUpdating(false);
        }
    };

    const queueThresholdUpdate = (nextThreshold: number) => {
        if (thresholdTimerRef.current) {
            window.clearTimeout(thresholdTimerRef.current);
        }

        thresholdTimerRef.current = window.setTimeout(() => {
            submitThresholdUpdate(nextThreshold);
        }, 400);
    };

    const handleThresholdChange = (nextThreshold: number) => {
        setThresholdTouched(true);
        setControl((prev) => ({
            ...prev,
            threshold: nextThreshold,
        }));
        setSnapshot((prev) =>
            prev
                ? {
                    ...prev,
                    threshold: nextThreshold,
                }
                : prev
        );
        queueThresholdUpdate(nextThreshold);
    };

    const status = snapshot?.status ?? "--";
    const value = snapshot?.value ?? 0;
    const threshold = snapshot?.threshold ?? 0;
    const updated = snapshot ? new Date(snapshot.timestamp).toLocaleTimeString() : "--";

    const valuePercent = useMemo(
        () => Math.min(100, Math.max(0, value)),
        [value]
    );

    const lightState = value >= threshold ? "Bright" : "Dark";
    const intensityLabel = valuePercent >= 80
        ? "Very bright"
        : valuePercent >= 60
            ? "Bright"
            : valuePercent >= 40
                ? "Balanced"
                : valuePercent >= 20
                    ? "Dim"
                    : "Very dark";
    const stageIndex = valuePercent >= 60 ? 2 : valuePercent >= 40 ? 1 : 0;
    const stageLabels = ["Dim", "Balanced", "Bright"];

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--home-bg)] text-[var(--home-strong)]">
                Checking access...
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--home-bg)] text-[var(--home-strong)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-[var(--home-orb-1)] opacity-70 blur-3xl" />
                <div className="absolute -bottom-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-[var(--home-orb-2)] opacity-60 blur-3xl" />
            </div>

            <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-14">
                <header className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm uppercase tracking-[0.35em] text-[var(--home-muted)]">
                            Light Control
                        </p>
                    </div>
                    <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-tight text-[var(--home-strong)] md:text-5xl">
                        Light sensor simulator
                    </h1>
                    <p className="max-w-2xl text-lg text-[var(--home-text)]">
                        Monitor the latest sensor output and send new thresholds or manual
                        values to test the system response.
                    </p>
                </header>

                <section className="grid gap-6 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
                    <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-8 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.45)] backdrop-blur">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.25em] text-[var(--home-muted)]">
                                    Latest light level
                                </p>
                                <div className="mt-4 flex items-end gap-4">
                                    <span className="text-6xl font-semibold text-[var(--home-strong)]">
                                        {value.toFixed(1)}
                                    </span>
                                    <span className="pb-2 text-lg text-[var(--home-muted)]">%</span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                        {lightState}
                                    </span>
                                    <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                        {intensityLabel}
                                    </span>
                                </div>
                                <div className="mt-6 grid w-full gap-4 sm:grid-cols-3">
                                    {stageLabels.map((label, index) => {
                                        const isActive = index === stageIndex;

                                        return (
                                            <div
                                                key={label}
                                                className="flex flex-col items-center gap-3 text-center"
                                            >
                                                <div
                                                    className={`flex h-16 w-16 items-center justify-center rounded-full border ${isActive
                                                        ? "border-amber-300/70 bg-amber-200/60 text-slate-900 shadow-[0_12px_30px_-18px_rgba(245,158,11,0.8)]"
                                                        : "border-[var(--home-card-border)] bg-white/60 text-[var(--home-muted)]"
                                                        }`}
                                                >
                                                    <div
                                                        className={`h-6 w-6 rounded-full ${isActive
                                                            ? "bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300"
                                                            : "bg-[var(--home-card-border)]"
                                                            }`}
                                                    />
                                                </div>
                                                <span
                                                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${isActive
                                                        ? "text-[var(--home-strong)]"
                                                        : "text-[var(--home-muted)]"
                                                        }`}
                                                >
                                                    {label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-2 text-sm font-medium text-[var(--home-text)]">
                                    {loading ? "Loading..." : status}
                                </div>
                                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--home-card-border)] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] shadow-[0_18px_40px_-30px_rgba(0,0,0,0.45)]">
                                    <span>Threshold</span>
                                    <span className="rounded-full bg-[var(--home-card)] px-3 py-1 text-sm font-semibold tracking-[0.08em] text-[var(--home-strong)]">
                                        {threshold}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="h-3 w-full overflow-hidden rounded-full bg-white/50">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-200 via-orange-300 to-rose-400 transition-all"
                                    style={{ width: `${valuePercent}%` }}
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-[var(--home-muted)]">
                                <span>Dark</span>
                                <span>Bright</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--home-muted)]">
                                System status
                            </p>
                            <p className="mt-4 text-xl font-semibold text-[var(--home-strong)]">
                                data stream
                            </p>
                            <p className="mt-2 text-sm text-[var(--home-text)]">Updated at {updated}</p>
                            {error && (
                                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                    {error}
                                </p>
                            )}
                        </div>
                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--home-muted)]">
                                Control desk
                            </p>
                            <form className="mt-4 flex flex-col gap-4" onSubmit={handleControlSubmit}>
                                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)]">
                                    Threshold
                                    <div className="mt-2 flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={control.threshold}
                                            onChange={(event) =>
                                                handleThresholdChange(Number(event.target.value))
                                            }
                                            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/60"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={control.threshold}
                                            onChange={(event) =>
                                                handleThresholdChange(Number(event.target.value))
                                            }
                                            className="w-20 rounded-xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-2 text-sm text-[var(--home-strong)]"
                                        />
                                    </div>
                                </label>
                                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)]">
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
                                        className="mt-2 w-full rounded-xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-2 text-sm text-[var(--home-strong)]"
                                    />
                                </label>
                                {controlError && (
                                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                        {controlError}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={controlBusy || thresholdUpdating}
                                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {controlBusy || thresholdUpdating ? "Sending" : "Send update"}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
