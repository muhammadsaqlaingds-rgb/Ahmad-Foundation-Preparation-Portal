import crypto from "crypto";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

const SESSION_COOKIE_NAME = "auth-token";
const SESSION_SECRET = process.env.SESSION_SECRET || "ahmad-foundation-secure-fallback-secret-2026";

/**
 * Hash a password using PBKDF2.
 */
export function hashPassword(password: string): { salt: string; hash: string } {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return { salt, hash };
}

/**
 * Verify a password against a salt and hash.
 */
export function verifyPassword(password: string, salt: string, hash: string): boolean {
    const checkHash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return checkHash === hash;
}

/**
 * Generate a signed session token.
 */
export function signToken(payload: Record<string, any>): string {
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiry
    const data = { ...payload, exp };
    const payloadStr = JSON.stringify(data);
    const base64Payload = Buffer.from(payloadStr).toString("base64url");

    const signature = crypto
        .createHmac("sha256", SESSION_SECRET)
        .update(base64Payload)
        .digest("base64url");

    return `${base64Payload}.${signature}`;
}

/**
 * Decode and verify a session token signature and expiration.
 */
export function verifyToken(token: string): any {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;

    const expectedSignature = crypto
        .createHmac("sha256", SESSION_SECRET)
        .update(base64Payload)
        .digest("base64url");

    if (signature !== expectedSignature) return null;

    try {
        const payloadStr = Buffer.from(base64Payload, "base64url").toString("utf8");
        const payload = JSON.parse(payloadStr);

        if (payload.exp && Date.now() > payload.exp) {
            return null; // Token expired
        }

        return payload;
    } catch {
        return null;
    }
}

/**
 * Retrieve the currently authenticated user based on session cookies.
 */
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const cookieVal = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        if (!cookieVal) return null;

        const payload = verifyToken(cookieVal);
        if (!payload || !payload.userId) return null;

        await connectToDatabase();
        const user = await User.findOne({ _id: payload.userId, isDeleted: { $ne: true } }).lean();
        return user as any;
    } catch (err) {
        console.error("getCurrentUser error:", err);
        return null;
    }
}

/**
 * Set the authentication cookie.
 */
export async function setSessionCookie(payload: Record<string, any>) {
    const token = signToken(payload);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

/**
 * Clear the authentication cookie.
 */
export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0, // Instant expiry
    });
}
