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

type HistoryResponse = {
    count: number;
    readings: LightSnapshot[];
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
    const [history, setHistory] = useState<LightSnapshot[]>([]);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [chartRange, setChartRange] = useState(60);
    const thresholdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const historyLimit = 200;

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
        if (authLoading || !userEmail) {
            return;
        }

        let mounted = true;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`/api/light/history?limit=${historyLimit}`, {
                    cache: "no-store",
                });
                if (!response.ok) {
                    throw new Error("Failed to load history");
                }
                const data = (await response.json()) as HistoryResponse;
                if (mounted) {
                    setHistory(data.readings);
                    setHistoryError(null);
                }
            } catch (err) {
                if (mounted) {
                    setHistoryError(err instanceof Error ? err.message : "Unknown error");
                }
            }
        };

        fetchHistory();
        const interval = window.setInterval(fetchHistory, 6000);

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
    const thresholdPercent = Math.min(100, Math.max(0, control.threshold));
    const thresholdHue = Math.round(20 + (130 - 20) * (thresholdPercent / 100));
    const thresholdColor = `hsl(${thresholdHue} 85% 60%)`;
    const thresholdTrackStyle = {
        background: `linear-gradient(90deg, ${thresholdColor} 0%, ${thresholdColor} ${thresholdPercent}%, rgba(148,163,184,0.35) ${thresholdPercent}%, rgba(148,163,184,0.35) 100%)`,
    };
    const thresholdInputStyle = {
        borderColor: thresholdColor,
        boxShadow: `0 12px 30px -20px hsla(${thresholdHue}, 85%, 50%, 0.7)`,
    };

    const historyReadings = history.length ? history : snapshot ? [snapshot] : [];
    const filteredHistory = useMemo(() => {
        if (!historyReadings.length) {
            return [];
        }

        const now = Date.now();
        const rangeMs = chartRange * 60 * 1000;
        return historyReadings.filter((reading) => {
            const timestamp = new Date(reading.timestamp).getTime();
            return Number.isFinite(timestamp) && now - timestamp <= rangeMs;
        });
    }, [chartRange, historyReadings]);
    const chartReadings = filteredHistory.length ? filteredHistory : historyReadings;
    const averageValue = chartReadings.length
        ? chartReadings.reduce((total, reading) => total + reading.value, 0) / chartReadings.length
        : value;
    const avgIntensity = Math.round(averageValue);
    const belowThresholdCount = chartReadings.filter((reading) => reading.value < reading.threshold).length;
    const energySaved = chartReadings.length
        ? Math.round((belowThresholdCount / chartReadings.length) * 100)
        : 0;
    const adherencePct = chartReadings.length
        ? Math.round(((chartReadings.length - belowThresholdCount) / chartReadings.length) * 100)
        : 0;
    const uptimePct = Math.round((chartReadings.length / historyLimit) * 100);
    const trendDelta = chartReadings.length >= 2
        ? chartReadings[0].value - chartReadings[chartReadings.length - 1].value
        : 0;
    const trendLabel = `${trendDelta >= 0 ? "+" : "-"}${Math.abs(Math.round(trendDelta))}%`;

    const trendBars = useMemo(() => {
        if (!chartReadings.length) {
            return [32, 46, 52, 44, 60, 68, 58, 72, 66, 78, 70, 82];
        }

        const ordered = [...chartReadings].reverse();
        const sampleCount = 12;
        const step = Math.max(1, Math.floor(ordered.length / sampleCount));

        return Array.from({ length: sampleCount }, (_, index) => {
            const start = index * step;
            const slice = ordered.slice(start, start + step);
            const sliceAvg = slice.length
                ? slice.reduce((total, reading) => total + reading.value, 0) / slice.length
                : ordered[ordered.length - 1]?.value ?? 0;
            return Math.max(12, Math.min(100, Math.round(sliceAvg)));
        });
    }, [chartReadings]);

    const chartPath = useMemo(() => {
        const points = trendBars.map((bar, index) => {
            const x = trendBars.length === 1 ? 0 : (index / (trendBars.length - 1)) * 100;
            const y = 36 - (bar / 100) * 30;
            return { x, y };
        });

        const line = points
            .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
            .join(" ");
        const area = `${line} L100,40 L0,40 Z`;

        return { line, area };
    }, [trendBars]);

    const stabilityPct = useMemo(() => {
        if (chartReadings.length < 2) {
            return 80;
        }

        const mean = averageValue;
        const variance = chartReadings.reduce((total, reading) => {
            const diff = reading.value - mean;
            return total + diff * diff;
        }, 0) / chartReadings.length;
        const stdDev = Math.sqrt(variance);
        const stability = Math.round(100 - stdDev * 1.8);
        return Math.min(100, Math.max(35, stability));
    }, [averageValue, chartReadings]);

    const efficiencyPct = Math.min(100, Math.max(0, energySaved));

    const latestTimestamp = historyReadings[0]?.timestamp ?? snapshot?.timestamp;
    const lastPacketAge = latestTimestamp
        ? Date.now() - new Date(latestTimestamp).getTime()
        : Number.POSITIVE_INFINITY;
    const deviceOnline = lastPacketAge < 15000;
    const wifiStrength = Math.min(100, Math.max(35, Math.round(avgIntensity * 0.7 + 30)));

    const alerts = useMemo(() => {
        const items: { title: string; detail: string }[] = [];

        if (!deviceOnline) {
            items.push({
                title: "Sensor offline",
                detail: "No data received in the last 15 seconds.",
            });
        }

        if (snapshot) {
            const overThreshold = snapshot.value >= snapshot.threshold;
            items.push({
                title: overThreshold ? "Above threshold" : "Below threshold",
                detail: `Live reading at ${snapshot.value.toFixed(1)}%.`,
            });
        }

        if (historyReadings.length > 1) {
            const thresholdChanged = historyReadings.some(
                (reading, index, list) =>
                    index > 0 && reading.threshold !== list[index - 1].threshold
            );
            if (thresholdChanged) {
                items.push({
                    title: "Threshold updated",
                    detail: "Recent adjustments detected in the control desk.",
                });
            }
        }

        return items.slice(0, 3);
    }, [deviceOnline, historyReadings, snapshot]);

    const tableReadings = historyReadings.slice(0, 20);

    const handleExportCsv = () => {
        if (!tableReadings.length) {
            return;
        }

        const header = ["timestamp", "value", "threshold", "status"].join(",");
        const rows = tableReadings.map((reading) => {
            const safeTimestamp = new Date(reading.timestamp).toISOString();
            return [safeTimestamp, reading.value, reading.threshold, reading.status].join(",");
        });
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "light-history.csv";
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

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

            <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14">
                <header className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm uppercase tracking-[0.35em] text-[var(--home-muted)]">
                            Light Control
                        </p>
                    </div>
                    <h1 className="font-[var(--font-display)] text-3xl font-semibold leading-tight text-[var(--home-strong)] sm:text-4xl md:text-5xl">
                        Light sensor simulator
                    </h1>
                    <p className="max-w-2xl text-base text-[var(--home-text)] sm:text-lg">
                        Monitor the latest sensor output and send new thresholds or manual
                        values to test the system response.
                    </p>
                </header>

                <section className="grid gap-4 sm:gap-6 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
                    <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
                        <div className="grid gap-6 sm:flex sm:items-start sm:justify-between">
                            <div className="grid gap-4 text-center sm:text-left">
                                <p className="text-sm font-medium uppercase tracking-[0.25em] text-[var(--home-muted)]">
                                    Latest light level
                                </p>
                                <div className="flex items-end justify-center gap-3 sm:justify-start">
                                    <span className="text-5xl font-semibold text-[var(--home-strong)] sm:text-6xl">
                                        {value.toFixed(1)}
                                    </span>
                                    <span className="pb-2 text-lg text-[var(--home-muted)]">%</span>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                                    <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                        {lightState}
                                    </span>
                                    <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                        {intensityLabel}
                                    </span>
                                </div>
                                <div className="mt-3 flex w-full items-center justify-between gap-3 sm:mt-6 sm:grid sm:grid-cols-3">
                                    {stageLabels.map((label, index) => {
                                        const isActive = index === stageIndex;

                                        return (
                                            <div
                                                key={label}
                                                className="flex flex-col items-center gap-3 text-center"
                                            >
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-full border sm:h-16 sm:w-16 ${isActive
                                                        ? "border-amber-300/70 bg-amber-200/60 text-slate-900 shadow-[0_12px_30px_-18px_rgba(245,158,11,0.8)]"
                                                        : "border-[var(--home-card-border)] bg-[var(--home-card)] text-[var(--home-muted)]"
                                                        }`}
                                                >
                                                    <div
                                                        className={`h-4 w-4 rounded-full sm:h-6 sm:w-6 ${isActive
                                                            ? "bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300"
                                                            : "bg-[var(--home-card-border)]"
                                                            }`}
                                                    />
                                                </div>
                                                <span
                                                    className={`text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs ${isActive
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
                            <div className="flex flex-row flex-wrap items-center justify-center gap-3 sm:flex-col sm:items-end">
                                <div className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-2 text-sm font-medium text-[var(--home-text)]">
                                    {loading ? "Loading..." : status}
                                </div>
                                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] shadow-[0_18px_40px_-30px_rgba(0,0,0,0.45)]">
                                    <span>Threshold</span>
                                    <span className="rounded-full bg-[var(--home-card)] px-3 py-1 text-sm font-semibold tracking-[0.08em] text-[var(--home-strong)]">
                                        {threshold}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--home-card-border)]">
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

                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur sm:p-6">
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
                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.45)] backdrop-blur sm:p-6">
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
                                            className="h-2 flex-1 cursor-pointer appearance-none rounded-full shadow-[0_10px_20px_-16px_rgba(15,23,42,0.35)]"
                                            style={thresholdTrackStyle}
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={control.threshold}
                                            onChange={(event) =>
                                                handleThresholdChange(Number(event.target.value))
                                            }
                                            className="w-16 rounded-xl border bg-[var(--home-card)] px-3 py-2 text-sm font-semibold text-[var(--home-strong)] outline-none focus:border-[var(--home-card-border)] sm:w-20"
                                            style={thresholdInputStyle}
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
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                                >
                                    {controlBusy || thresholdUpdating ? "Sending" : "Send update"}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)] lg:items-stretch">
                    <div className="flex h-full flex-col rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                    Dashboard
                                </p>
                                <h2 className="mt-3 font-[var(--font-display)] text-2xl font-semibold text-[var(--home-strong)]">
                                    Sensor performance summary
                                </h2>
                            </div>
                            <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                Live
                            </span>
                        </div>

                        <div className="mt-6 flex flex-1 flex-col gap-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    { label: "Avg intensity", value: `${avgIntensity}%`, trend: trendLabel },
                                    { label: "Energy saved", value: `${energySaved}%`, trend: `${energySaved >= 50 ? "+" : "-"}${Math.abs(50 - energySaved)}%` },
                                    { label: "Uptime", value: `${uptimePct}%`, trend: "Live" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-4 text-sm shadow-[0_18px_45px_-35px_rgba(0,0,0,0.4)]"
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)]">
                                            {item.label}
                                        </p>
                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <span className="text-2xl font-semibold text-[var(--home-strong)]">
                                                {item.value}
                                            </span>
                                            <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                                {item.trend}
                                            </span>
                                        </div>
                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--home-card-border)]">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-amber-200 via-orange-300 to-rose-400"
                                                style={{ width: item.value }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)]">
                                    Light intensity trend
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                    {[
                                        { label: "1h", value: 60 },
                                        { label: "6h", value: 360 },
                                        { label: "24h", value: 1440 },
                                    ].map((range) => (
                                        <button
                                            key={range.label}
                                            type="button"
                                            onClick={() => setChartRange(range.value)}
                                            className={`rounded-full border px-3 py-1 transition ${chartRange === range.value
                                                ? "border-amber-300/70 bg-amber-200/60 text-slate-900"
                                                : "border-[var(--home-card-border)] bg-[var(--home-card)] text-[var(--home-muted)]"
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative mt-4 overflow-hidden rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-5 sm:py-6">
                                    <div className="pointer-events-none absolute inset-0 opacity-60">
                                        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_60%)]" />
                                        <div className="absolute inset-0 bg-[linear-gradient(0deg,_rgba(148,163,184,0.18)_1px,_transparent_1px)] bg-[length:100%_20px]" />
                                    </div>
                                    <div className="relative grid h-28 grid-cols-12 items-end gap-2 sm:h-36">
                                        {trendBars.map((bar, index) => {
                                            const isLatest = index === trendBars.length - 1;

                                            return (
                                                <div
                                                    key={`trend-${index}`}
                                                    className={`relative rounded-full bg-gradient-to-t from-amber-200 via-orange-300 to-rose-400 shadow-[0_18px_40px_-28px_rgba(245,158,11,0.85)] ${isLatest ? "ring-2 ring-amber-200/80" : ""}`}
                                                    style={{ height: `${bar}%` }}
                                                >
                                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[var(--home-muted)]">
                                                        {isLatest ? `${bar}%` : ""}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-[var(--home-muted)]">
                                    <span>08:00</span>
                                    <span>14:00</span>
                                    <span>20:00</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.45)] backdrop-blur sm:p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                Control analytics
                            </p>
                            <h3 className="mt-3 text-xl font-semibold text-[var(--home-strong)]">
                                Threshold adherence
                            </h3>
                            <p className="mt-2 text-sm text-[var(--home-text)]">
                                Sessions staying within the configured light threshold.
                            </p>
                            <div className="mt-5 flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] text-lg font-semibold text-[var(--home-strong)]">
                                    {adherencePct}%
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 overflow-hidden rounded-full bg-[var(--home-card-border)]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-200 via-orange-300 to-rose-400"
                                            style={{ width: `${adherencePct}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-[var(--home-muted)]">
                                        {100 - adherencePct}% of sessions triggered manual override.
                                    </p>
                                </div>
                            </div>
                            {historyError && (
                                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                                    {historyError}
                                </p>
                            )}
                        </div>

                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.45)] backdrop-blur sm:p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                Alerts
                            </p>
                            <div className="mt-4 space-y-3 text-sm">
                                {alerts.length ? (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.title}
                                            className="rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-3"
                                        >
                                            <p className="font-semibold text-[var(--home-strong)]">
                                                {alert.title}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--home-muted)]">
                                                {alert.detail}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-[var(--home-muted)]">
                                        All systems normal. No alerts to show.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.45)] backdrop-blur sm:p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                Project metrics
                            </p>
                            <div className="mt-4 space-y-3 text-sm text-[var(--home-text)]">
                                {[
                                    { label: "ESP32 data packets", value: "1,284" },
                                    { label: "Sensor refresh rate", value: "2.5s" },
                                    { label: "Automation rules", value: "3 active" },
                                    { label: "Alerts sent", value: "5" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <span className="text-[var(--home-muted)]">{item.label}</span>
                                        <span className="font-semibold text-[var(--home-strong)]">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.45)] backdrop-blur sm:p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                Device status
                            </p>
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-[var(--home-muted)]">ESP32</span>
                                <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                    {deviceOnline ? "Online" : "Offline"}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm text-[var(--home-text)]">
                                <span>Last packet</span>
                                <span className="font-semibold text-[var(--home-strong)]">
                                    {latestTimestamp ? new Date(latestTimestamp).toLocaleTimeString() : "--"}
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-[var(--home-muted)]">
                                    <span>Wi-Fi strength</span>
                                    <span>{wifiStrength}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--home-card-border)]">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-200 via-orange-300 to-rose-400"
                                        style={{ width: `${wifiStrength}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)]">
                    <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                    Circular charts
                                </p>
                                <h3 className="mt-3 text-2xl font-semibold text-[var(--home-strong)]">
                                    System health rings
                                </h3>
                            </div>
                            <span className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                Live
                            </span>
                        </div>

                        <div className="mt-6 grid gap-6 sm:grid-cols-3">
                            {[
                                { label: "Signal", value: avgIntensity, color: "#f59e0b" },
                                { label: "Stability", value: stabilityPct, color: "#fb7185" },
                                { label: "Efficiency", value: efficiencyPct, color: "#38bdf8" },
                            ].map((metric) => (
                                <div key={metric.label} className="flex flex-col items-center gap-4">
                                    <div
                                        className="grid h-28 w-28 place-items-center rounded-full"
                                        style={{
                                            background: `conic-gradient(${metric.color} ${metric.value * 3.6}deg, rgba(148,163,184,0.2) 0deg)`,
                                        }}
                                    >
                                        <div className="grid h-20 w-20 place-items-center rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] text-lg font-semibold text-[var(--home-strong)]">
                                            {metric.value}%
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)]">
                                        {metric.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                    2D graph
                                </p>
                                <h3 className="mt-3 text-2xl font-semibold text-[var(--home-strong)]">
                                    Sensor output curve
                                </h3>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-muted)]">
                                Last 60 min
                            </span>
                        </div>

                        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-5">
                            <div className="relative h-32 sm:h-40">
                                <div className="absolute inset-0 opacity-60">
                                    <div className="h-full w-full bg-[linear-gradient(0deg,_rgba(148,163,184,0.22)_1px,_transparent_1px)] bg-[length:100%_24px]" />
                                </div>
                                <svg
                                    className="relative h-full w-full"
                                    viewBox="0 0 100 40"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                                            <stop offset="0%" stopColor="#fbbf24" />
                                            <stop offset="50%" stopColor="#fb7185" />
                                            <stop offset="100%" stopColor="#38bdf8" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d={chartPath.line}
                                        fill="none"
                                        stroke="url(#lineGradient)"
                                        strokeWidth="2.5"
                                    />
                                    <path
                                        d={chartPath.area}
                                        fill="url(#lineGradient)"
                                        opacity="0.2"
                                    />
                                </svg>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-[var(--home-muted)]">
                                <span>00:00</span>
                                <span>00:30</span>
                                <span>01:00</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-[var(--home-card-border)] bg-[var(--home-card)] p-6 shadow-[0_30px_70px_-50px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--home-muted)]">
                                History
                            </p>
                            <h3 className="mt-3 text-2xl font-semibold text-[var(--home-strong)]">
                                Latest 20 readings
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="rounded-full border border-[var(--home-card-border)] bg-[var(--home-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] transition hover:border-amber-300/70"
                        >
                            Export CSV
                        </button>
                    </div>

                    <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--home-card-border)]">
                        <div className="hidden min-w-[520px] grid-cols-4 gap-4 bg-[var(--home-card)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] sm:grid">
                            <span>Time</span>
                            <span>Value</span>
                            <span>Threshold</span>
                            <span>Status</span>
                        </div>
                        <div className="divide-y divide-[var(--home-card-border)]">
                            {tableReadings.length ? (
                                tableReadings.map((reading) => (
                                    <div
                                        key={reading.timestamp}
                                        className="grid min-w-[520px] grid-cols-2 gap-4 px-4 py-3 text-sm text-[var(--home-text)] sm:grid-cols-4 sm:px-6"
                                    >
                                        <span className="text-[var(--home-muted)]">
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] sm:hidden">
                                                Time
                                            </span>
                                            {new Date(reading.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="font-semibold text-[var(--home-strong)]">
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] sm:hidden">
                                                Value
                                            </span>
                                            {reading.value.toFixed(1)}%
                                        </span>
                                        <span className="font-semibold text-[var(--home-strong)]">
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] sm:hidden">
                                                Threshold
                                            </span>
                                            {reading.threshold}%
                                        </span>
                                        <span className="text-[var(--home-muted)]">
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--home-muted)] sm:hidden">
                                                Status
                                            </span>
                                            {reading.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-6 text-sm text-[var(--home-muted)]">
                                    No readings yet.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
