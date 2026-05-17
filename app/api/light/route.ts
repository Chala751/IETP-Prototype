import { getDbName, getMongoClient } from "@/lib/mongodb";

type LedMode = "auto" | "on" | "off";
type LedStatus = "ON" | "OFF";

let lastValue = 52;
let lastThreshold = 40;
let lastLedMode: LedMode = "auto";
let lastLedStatus: LedStatus | null = null;
let lastDeviceTimestamp: Date | null = null;
let lastTick = Date.now();

function nextLightPercent() {
    const now = Date.now();
    const elapsed = Math.max(1, now - lastTick) / 1000;
    lastTick = now;

    const time = now / 1000;
    const wave = Math.sin(time / 6) * 18;
    const ripple = Math.sin(time * 1.3) * 4;
    const target = 55 + wave + ripple;

    lastValue += (target - lastValue) * Math.min(0.35, elapsed / 3);
    lastValue = Math.max(0, Math.min(100, lastValue));

    return Math.round(lastValue * 10) / 10;
}

function percentFromRaw(raw: number) {
    const clamped = Math.max(0, Math.min(4095, raw));
    const percent = (clamped / 4095) * 100;
    return Math.round(percent * 10) / 10;
}

async function insertReading(
    value: number,
    threshold: number,
    status: string,
    source: "device" | "dashboard",
    ledMode: LedMode,
    ledStatus?: LedStatus | null,
    raw?: number
) {
    const client = await getMongoClient();
    const db = client.db(getDbName());
    await db.collection("lightData").insertOne({
        value,
        threshold,
        status,
        source,
        ledMode,
        ledStatus: ledStatus ?? null,
        raw: typeof raw === "number" ? raw : undefined,
        timestamp: new Date(),
    });
}

function buildSnapshot(value: number, threshold: number, status: string, timestamp: Date) {
    return {
        value,
        threshold,
        status,
        ledMode: lastLedMode,
        ledStatus: lastLedStatus,
        timestamp: timestamp.toISOString(),
    };
}

export async function GET() {
    const hasDeviceReading = Boolean(lastDeviceTimestamp);
    const value = hasDeviceReading ? lastValue : nextLightPercent();
    const threshold = lastThreshold;
    const status = value < threshold ? "Dark" : "Bright";
    const timestamp = hasDeviceReading ? lastDeviceTimestamp! : new Date();

    await insertReading(value, threshold, status, "dashboard", lastLedMode, lastLedStatus);

    return Response.json(buildSnapshot(value, threshold, status, timestamp));
}

export async function POST(request: Request) {
    const body = (await request.json()) as {
        value?: number;
        threshold?: number;
        ledMode?: LedMode;
        deviceId?: string;
        raw?: number;
        ledStatus?: LedStatus;
    };

    const isDevicePayload =
        typeof body.raw === "number" || typeof body.ledStatus === "string" || Boolean(body.deviceId);

    if (isDevicePayload) {
        const raw = typeof body.raw === "number" ? body.raw : undefined;
        const value = typeof body.value === "number" ? body.value : raw ? percentFromRaw(raw) : lastValue;
        const threshold = typeof body.threshold === "number" ? body.threshold : lastThreshold;

        lastValue = value;
        lastThreshold = threshold;
        if (body.ledStatus === "ON" || body.ledStatus === "OFF") {
            lastLedStatus = body.ledStatus;
        }
        lastDeviceTimestamp = new Date();

        const status = value < threshold ? "Dark" : "Bright";

        await insertReading(value, threshold, status, "device", lastLedMode, lastLedStatus, raw);

        return Response.json(buildSnapshot(value, threshold, status, lastDeviceTimestamp));
    }

    const hasValue = typeof body.value === "number";
    const hasThreshold = typeof body.threshold === "number";
    const value = hasValue ? body.value! : nextLightPercent();
    const threshold = hasThreshold ? body.threshold! : lastThreshold;

    if (hasValue) {
        lastValue = value;
    }
    if (hasThreshold) {
        lastThreshold = threshold;
    }
    if (body.ledMode === "auto" || body.ledMode === "on" || body.ledMode === "off") {
        lastLedMode = body.ledMode;
    }
    const status = value < threshold ? "Dark" : "Bright";

    await insertReading(value, threshold, status, "dashboard", lastLedMode, lastLedStatus);

    return Response.json(buildSnapshot(value, threshold, status, new Date()));
}
