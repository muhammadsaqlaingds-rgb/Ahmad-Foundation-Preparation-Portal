import crypto from "crypto";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";

// ─── Admin Session Cookie ────────────────────────────────────────────────────

const ADMIN_COOKIE_NAME = "admin-session";
const ADMIN_SECRET =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    "ahmad-foundation-admin-fallback-secret-2026";

/** Sign a small payload into a tamper-proof token. */
function signAdminToken(payload: Record<string, unknown>): string {
    const exp = Date.now() + 8 * 60 * 60 * 1000; // 8-hour session
    const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
    const sig = crypto
        .createHmac("sha256", ADMIN_SECRET)
        .update(data)
        .digest("base64url");
    return `${data}.${sig}`;
}

/** Verify and decode an admin token. Returns null if invalid or expired. */
function verifyAdminToken(token: string): Record<string, unknown> | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, sig] = parts;
    const expected = crypto
        .createHmac("sha256", ADMIN_SECRET)
        .update(data)
        .digest("base64url");
    if (sig !== expected) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
        if (payload.exp && Date.now() > payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
}

/** Set the admin session cookie after a successful login. */
export async function setAdminSessionCookie() {
    const token = signAdminToken({ admin: true });
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 8 * 60 * 60, // 8 hours
    });
}

/** Clear the admin session cookie on logout. */
export async function clearAdminSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
}

/**
 * Call at the top of every admin API route handler.
 * Returns { authorized: true } or a ready-to-return 401 NextResponse.
 *
 * Usage:
 *   const authResult = await requireAdmin();
 *   if (!authResult.authorized) return authResult.response;
 */
export async function requireAdmin(): Promise<
    { authorized: true; response?: never } | { authorized: false; response: Response }
> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
        const payload = token ? verifyAdminToken(token) : null;
        if (!payload?.admin) {
            const { NextResponse } = await import("next/server");
            return {
                authorized: false,
                response: NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                ),
            };
        }
        return { authorized: true };
    } catch {
        const { NextResponse } = await import("next/server");
        return {
            authorized: false,
            response: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            ),
        };
    }
}

// ─── Admin Credential Helpers ────────────────────────────────────────────────

export async function ensureAdminFromEnv() {
    const rawEmail = process.env.ADMIN_EMAIL;
    const rawPassword = process.env.ADMIN_PASSWORD;

    const email = rawEmail ? rawEmail.trim() : "";
    const password = rawPassword ? rawPassword.trim() : "";

    if (!email || !password) {
        console.warn("ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment variables.");
        return;
    }

    await connectToDatabase();

    const existing = await Admin.findOne({ email });

    if (!existing) {
        await Admin.create({ email, password });
        console.log("Admin created from env.", { email });
        return;
    }

    if (existing.password !== password) {
        existing.password = password;
        await existing.save();
        console.log("Admin password updated from env.", { email });
        return;
    }

    console.log("Admin from env already exists with same credentials.", { email });
}

export async function validateAdminCredentials(email: string, password: string) {
    const inputEmail = email.trim();
    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) return false;

    await connectToDatabase();

    const admin = await Admin.findOne({ email: inputEmail });
    if (!admin) return false;

    const dbPassword = typeof admin.password === "string" ? admin.password.trim() : "";

    const match = dbPassword === inputPassword;

    if (!match) {
        console.warn("Admin login failed: password mismatch for email", {
            email: inputEmail,
            inputLength: inputPassword.length,
            storedLength: dbPassword.length,
        });
    }

    return match;
}

