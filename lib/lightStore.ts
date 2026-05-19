type LedMode = "auto" | "on" | "off";
type LedStatus = "ON" | "OFF";

type LightSnapshot = {
    value: number;
    threshold: number;
    status: "Bright" | "Dark";
    ledMode: LedMode;
    ledStatus: LedStatus;
    timestamp: string;
    deviceId: string;
    raw: number;
};

type DevicePayload = {
    deviceId?: string;
    raw?: number;
    value?: number;
    threshold?: number;
    ledStatus?: LedStatus;
};

type DashboardPayload = {
    value?: number;
    threshold?: number;
    ledMode?: LedMode;
};

const DEFAULT_DEVICE_ID = "esp32-wokwi-01";
const MAX_HISTORY = 200;

let state = {
    deviceId: DEFAULT_DEVICE_ID,
    raw: 2048,
    value: 50,
    threshold: 40,
    ledMode: "auto" as LedMode,
    ledStatus: "OFF" as LedStatus,
    timestamp: new Date(),
};

const history: LightSnapshot[] = [];

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

function buildSnapshot() {
    return {
        value: state.value,
        threshold: state.threshold,
        status: resolveStatus(state.value, state.threshold),
        ledMode: state.ledMode,
        ledStatus: state.ledStatus,
        timestamp: state.timestamp.toISOString(),
        deviceId: state.deviceId,
        raw: state.raw,
    } satisfies LightSnapshot;
}

function pushHistory(snapshot: LightSnapshot) {
    history.unshift(snapshot);
    if (history.length > MAX_HISTORY) {
        history.length = MAX_HISTORY;
    }
}

export function getLightSnapshot() {
    const snapshot = buildSnapshot();
    if (!history.length) {
        pushHistory(snapshot);
    }
    return snapshot;
}

export function getLightHistory(limit: number) {
    return history.slice(0, Math.max(1, Math.min(MAX_HISTORY, limit)));
}

export function updateFromDevice(payload: DevicePayload) {
    const nextRaw =
        typeof payload.raw === "number"
            ? payload.raw
            : typeof payload.value === "number"
                ? rawFromPercent(payload.value)
                : state.raw;
    const nextValue =
        typeof payload.value === "number"
            ? payload.value
            : typeof payload.raw === "number"
                ? percentFromRaw(payload.raw)
                : state.value;
    const nextThreshold =
        typeof payload.threshold === "number" ? payload.threshold : state.threshold;
    const nextDeviceId = typeof payload.deviceId === "string" ? payload.deviceId : state.deviceId;
    const nextLedStatus =
        payload.ledStatus === "ON" || payload.ledStatus === "OFF"
            ? payload.ledStatus
            : computeLedStatus(nextValue, nextThreshold, state.ledMode);

    state = {
        ...state,
        raw: nextRaw,
        value: nextValue,
        threshold: nextThreshold,
        deviceId: nextDeviceId,
        ledStatus: nextLedStatus,
        timestamp: new Date(),
    };

    const snapshot = buildSnapshot();
    pushHistory(snapshot);
    return snapshot;
}

export function updateFromDashboard(payload: DashboardPayload) {
    const nextValue = typeof payload.value === "number" ? payload.value : state.value;
    const nextThreshold =
        typeof payload.threshold === "number" ? payload.threshold : state.threshold;
    const nextLedMode =
        payload.ledMode === "auto" || payload.ledMode === "on" || payload.ledMode === "off"
            ? payload.ledMode
            : state.ledMode;
    const nextRaw = typeof payload.value === "number" ? rawFromPercent(payload.value) : state.raw;
    const nextLedStatus = computeLedStatus(nextValue, nextThreshold, nextLedMode);

    state = {
        ...state,
        raw: nextRaw,
        value: nextValue,
        threshold: nextThreshold,
        ledMode: nextLedMode,
        ledStatus: nextLedStatus,
        timestamp: new Date(),
    };

    const snapshot = buildSnapshot();
    pushHistory(snapshot);
    return snapshot;
}
