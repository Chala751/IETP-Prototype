import { getDbName, getMongoClient } from "@/lib/mongodb";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(limitParam)
        ? Math.min(200, Math.max(1, limitParam))
        : 50;

    const client = await getMongoClient();
    const db = client.db(getDbName());

    const readings = await db
        .collection("lightData")
        .find({}, { projection: { _id: 0 } })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

    return Response.json({
        count: readings.length,
        readings,
    });
}
