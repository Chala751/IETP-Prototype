import { cookies } from "next/headers";

import { getSessionUser } from "@/lib/auth";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getSessionUser(token);

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({ user });
}
