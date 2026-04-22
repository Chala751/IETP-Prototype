import { cookies } from "next/headers";

import {
    SESSION_MAX_AGE_SECONDS,
    createSession,
    getUserByEmail,
    normalizeEmail,
    verifyPassword,
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

    const user = await getUserByEmail(email);
    if (!user) {
        return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const session = await createSession(user._id);

    const cookieStore = await cookies();

    cookieStore.set("session", session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return Response.json({ email: user.email });
}
