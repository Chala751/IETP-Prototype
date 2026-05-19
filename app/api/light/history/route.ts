import { getLightHistory } from "@/lib/lightStore";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(limitParam)
        ? Math.min(200, Math.max(1, limitParam))
        : 50;

    const readings = getLightHistory(limit);

    return Response.json({
        count: readings.length,
        readings,
    });
}
