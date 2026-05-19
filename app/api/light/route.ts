import {
    getLightSnapshot,
    updateFromDashboard,
    updateFromDevice,
} from "@/lib/lightStore";

export async function GET() {
    return Response.json(getLightSnapshot());
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

    const snapshot = isDevicePayload
        ? updateFromDevice(body)
        : updateFromDashboard({
            value: typeof body.value === "number" ? body.value : undefined,
            threshold: typeof body.threshold === "number" ? body.threshold : undefined,
            ledMode: body.ledMode,
        });

    return Response.json(snapshot);
}
