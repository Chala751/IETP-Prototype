import { getDbName, getMongoClient } from "@/lib/mongodb";

let lastValue = 52;
let lastThreshold = 40;
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

async function insertReading(value: number, threshold: number, status: string) {
    const client = await getMongoClient();
    const db = client.db(getDbName());
    await db.collection("lightData").insertOne({
        value,
        threshold,
        status,
        timestamp: new Date(),
    });
}

export async function GET() {
    const value = nextLightPercent();
    const threshold = lastThreshold;
    const status = value < threshold ? "Dark" : "Bright";

    await insertReading(value, threshold, status);

    return Response.json({
        value,
        threshold,
        status,
        timestamp: new Date().toISOString(),
    });
}

export async function POST(request: Request) {
    const body = (await request.json()) as { value?: number; threshold?: number };
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
    const status = value < threshold ? "Dark" : "Bright";

    await insertReading(value, threshold, status);

    return Response.json({
        value,
        threshold,
        status,
        timestamp: new Date().toISOString(),
    });
}
