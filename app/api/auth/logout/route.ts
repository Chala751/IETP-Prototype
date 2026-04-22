import { cookies } from "next/headers";

import { deleteSession } from "@/lib/auth";

export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (token) {
        await deleteSession(token);
    }

    cookieStore.set("session", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });

    return Response.json({ ok: true });
}
