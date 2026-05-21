import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
    try {
        await clearSessionCookie();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Logout API error:", err);
        return NextResponse.json({ error: "Failed to logout. Please try again." }, { status: 500 });
    }
}
