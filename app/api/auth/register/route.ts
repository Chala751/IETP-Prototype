import { cookies } from "next/headers";

import {
    SESSION_MAX_AGE_SECONDS,
    createSession,
    createUser,
    getUserByEmail,
    normalizeEmail,
} from "@/lib/auth";

export async function POST(request: Request) {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email ? normalizeEmail(body.email) : "";
    const password = body.password ?? "";

    if (!email || !password) {
        return Response.json(
            { error: "Email and password are required." },
            { status: 400 }
        );
    }

    if (password.length < 8) {
        return Response.json(
            { error: "Password must be at least 8 characters." },
            { status: 400 }
        );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
        return Response.json(
            { error: "Email already registered." },
            { status: 409 }
        );
    }

    const userId = await createUser(email, password);
    const session = await createSession(userId);

    const cookieStore = await cookies();

    cookieStore.set("session", session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return Response.json({ email });
}
