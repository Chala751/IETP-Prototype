let lastValue = 52;
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

export async function GET() {
    const value = nextLightPercent();
    const threshold = 40;
    const status = value < threshold ? "Dark" : "Bright";

    return Response.json({
        value,
        threshold,
        status,
        timestamp: new Date().toISOString(),
    });
}
