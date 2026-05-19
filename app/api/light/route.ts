import { getDbName, getMongoClient } from "@/lib/mongodb";

type LedMode = "auto" | "on" | "off";
type LedStatus = "ON" | "OFF";

type LightState = {
    value: number;
    threshold: number;
    status: "Bright" | "Dark";
    ledMode: LedMode;
    ledStatus: LedStatus;
    timestamp: string;
    deviceId: string;
    raw: number;
};

const DEFAULT_DEVICE_ID = "esp32-wokwi-01";

function percentFromRaw(raw: number) {
    const clamped = Math.max(0, Math.min(4095, raw));
    return Math.round((clamped / 4095) * 1000) / 10;
}

function rawFromPercent(value: number) {
    const clamped = Math.max(0, Math.min(100, value));
    return Math.round((clamped / 100) * 4095);
}

function resolveStatus(value: number, threshold: number) {
    return value >= threshold ? "Bright" : "Dark";
}

function computeLedStatus(value: number, threshold: number, ledMode: LedMode) {
    if (ledMode === "on") {
        return "ON";
    }
    if (ledMode === "off") {
        return "OFF";
    }
    return value < threshold ? "ON" : "OFF";
}

async function getState() {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    const state = await db.collection("lightState").findOne({ _id: "latest" });

    if (state) {
        const { _id, ...rest } = state as LightState & { _id: string };
        return rest;
    }

    const initial: LightState = {
        value: 50,
        threshold: 40,
        status: "Bright",
        ledMode: "auto",
        ledStatus: "OFF",
        timestamp: new Date().toISOString(),
        deviceId: DEFAULT_DEVICE_ID,
        raw: rawFromPercent(50),
    };

    await db.collection("lightState").updateOne(
        { _id: "latest" },
        { $set: initial },
        { upsert: true }
    );

    return initial;
}

async function setState(state: LightState) {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    await db.collection("lightState").updateOne(
        { _id: "latest" },
        { $set: state },
        { upsert: true }
    );
}

async function insertReading(state: LightState, source: "device" | "dashboard") {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    await db.collection("lightData").insertOne({
        ...state,
        source,
        timestamp: new Date(state.timestamp),
    });
}

export async function GET() {
    const state = await getState();
    return Response.json(state);
}

export async function POST(request: Request) {
    const body = (await request.json()) as {
        value?: number;
        threshold?: number;
        ledMode?: "auto" | "on" | "off";
        deviceId?: string;
        raw?: number;
        ledStatus?: "ON" | "OFF";
    };

    const isDevicePayload =
        typeof body.raw === "number" ||
        body.ledStatus === "ON" ||
        body.ledStatus === "OFF" ||
        typeof body.deviceId === "string";

    const current = await getState();

    if (isDevicePayload) {
        const nextRaw =
            typeof body.raw === "number"
                ? body.raw
                : typeof body.value === "number"
                    ? rawFromPercent(body.value)
                    : current.raw;
        const nextValue =
            typeof body.value === "number"
                ? body.value
                : typeof body.raw === "number"
                    ? percentFromRaw(body.raw)
                    : current.value;
        const nextThreshold =
            typeof body.threshold === "number" ? body.threshold : current.threshold;
        const nextDeviceId = typeof body.deviceId === "string" ? body.deviceId : current.deviceId;
        const nextLedStatus =
            body.ledStatus === "ON" || body.ledStatus === "OFF"
                ? body.ledStatus
                : computeLedStatus(nextValue, nextThreshold, current.ledMode);

        const nextState: LightState = {
            ...current,
            raw: nextRaw,
            value: nextValue,
            threshold: nextThreshold,
            ledStatus: nextLedStatus,
            status: resolveStatus(nextValue, nextThreshold),
            deviceId: nextDeviceId,
            timestamp: new Date().toISOString(),
        };

        await setState(nextState);
        await insertReading(nextState, "device");
        return Response.json(nextState);
    }

    const nextValue = typeof body.value === "number" ? body.value : current.value;
    const nextThreshold =
        typeof body.threshold === "number" ? body.threshold : current.threshold;
    const nextLedMode: LedMode =
        body.ledMode === "auto" || body.ledMode === "on" || body.ledMode === "off"
            ? body.ledMode
            : current.ledMode;
    const nextRaw = typeof body.value === "number" ? rawFromPercent(body.value) : current.raw;
    const nextLedStatus = computeLedStatus(nextValue, nextThreshold, nextLedMode);

    const nextState: LightState = {
        ...current,
        raw: nextRaw,
        value: nextValue,
        threshold: nextThreshold,
        ledMode: nextLedMode,
        ledStatus: nextLedStatus,
        status: resolveStatus(nextValue, nextThreshold),
        timestamp: new Date().toISOString(),
    };

    await setState(nextState);
    await insertReading(nextState, "dashboard");

    return Response.json(nextState);
}
