import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

/** Used by AdminShell to verify the session cookie server-side. */
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    return NextResponse.json({ authenticated: true }, { status: 200 });
}
