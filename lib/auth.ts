import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { ObjectId } from "mongodb";

import { getDbName, getMongoClient } from "@/lib/mongodb";

const scryptAsync = promisify(scrypt);

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthUser = {
    id: string;
    email: string;
};

type UserDocument = {
    _id: ObjectId;
    email: string;
    passwordHash: string;
    createdAt: Date;
};

type SessionDocument = {
    token: string;
    userId: ObjectId;
    expiresAt: Date;
};

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
    const [salt, storedKey] = storedHash.split(":");

    if (!salt || !storedKey) {
        return false;
    }

    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(storedKey, "hex");

    if (storedBuffer.length !== derivedKey.length) {
        return false;
    }

    return timingSafeEqual(storedBuffer, derivedKey);
}

export async function getUserByEmail(email: string) {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    return db.collection<UserDocument>("users").findOne({ email });
}

export async function createUser(email: string, password: string) {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    const passwordHash = await hashPassword(password);
    const result = await db.collection<UserDocument>("users").insertOne({
        _id: new ObjectId(),
        email,
        passwordHash,
        createdAt: new Date(),
    });

    return result.insertedId;
}

export async function createSession(userId: ObjectId) {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    await db.collection<SessionDocument>("sessions").insertOne({
        token,
        userId,
        expiresAt,
    });

    return { token, expiresAt };
}

export async function getSessionUser(token: string) {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    const session = await db.collection<SessionDocument>("sessions").findOne({ token });

    if (!session) {
        return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
        await db.collection<SessionDocument>("sessions").deleteOne({ token });
        return null;
    }

    const user = await db
        .collection<UserDocument>("users")
        .findOne({ _id: session.userId });

    if (!user) {
        return null;
    }

    return {
        id: user._id.toString(),
        email: user.email,
    } satisfies AuthUser;
}

export async function deleteSession(token: string) {
    const client = await getMongoClient();
    const db = client.db(getDbName());

    await db.collection<SessionDocument>("sessions").deleteOne({ token });
}
