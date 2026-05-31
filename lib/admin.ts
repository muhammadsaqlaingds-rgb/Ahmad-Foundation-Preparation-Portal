import crypto from "crypto";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";

// ─── Admin Session Cookie ────────────────────────────────────────────────────

const ADMIN_COOKIE_NAME = "admin-session";

function getAdminSecret(): string {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error(
            "ADMIN_SESSION_SECRET (or SESSION_SECRET) environment variable is required but not set."
        );
    }
    return secret;
}

/** Sign a small payload into a tamper-proof token. */
function signAdminToken(payload: Record<string, unknown>): string {
    const ADMIN_SECRET = getAdminSecret();
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
    const ADMIN_SECRET = getAdminSecret();
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

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Seed or update the admin record from environment variables.
 * Passwords are always stored as bcrypt hashes — never plaintext.
 * Handles migration: if an existing record has a legacy plaintext `password`
 * field (from before this fix), it is hashed and moved to `passwordHash`.
 */
export async function ensureAdminFromEnv() {
    const rawEmail = process.env.ADMIN_EMAIL;
    const rawPassword = process.env.ADMIN_PASSWORD;

    const email = rawEmail?.trim() ?? "";
    const password = rawPassword?.trim() ?? "";

    if (!email || !password) {
        console.warn("ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment variables.");
        return;
    }

    await connectToDatabase();

    const existing = await Admin.findOne({ email }).lean() as any;

    if (!existing) {
        // Fresh install — hash and store
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await Admin.create({ email, passwordHash });
        console.log("Admin created from env (hashed).", { email });
        return;
    }

    // ── Migration: legacy record has plaintext `password` field ──────────────
    if (existing.password && !existing.passwordHash) {
        console.log("Migrating admin record from plaintext password to bcrypt hash.", { email });
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await Admin.updateOne(
            { email },
            { $set: { passwordHash }, $unset: { password: "" } }
        );
        console.log("Admin password migrated to bcrypt hash.", { email });
        return;
    }

    // ── Normal update: re-hash if the env password has changed ───────────────
    const isSame = existing.passwordHash
        ? await bcrypt.compare(password, existing.passwordHash)
        : false;

    if (!isSame) {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await Admin.updateOne({ email }, { $set: { passwordHash } });
        console.log("Admin password updated (re-hashed).", { email });
        return;
    }

    console.log("Admin from env already up-to-date.", { email });
}

/**
 * Validate admin credentials using bcrypt.compare.
 * Returns true only if the email exists and the password matches the stored hash.
 */
export async function validateAdminCredentials(email: string, password: string): Promise<boolean> {
    const inputEmail = email.trim();
    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) return false;

    await connectToDatabase();

    const admin = await Admin.findOne({ email: inputEmail }).lean() as any;
    if (!admin?.passwordHash) return false;

    return bcrypt.compare(inputPassword, admin.passwordHash);
}

