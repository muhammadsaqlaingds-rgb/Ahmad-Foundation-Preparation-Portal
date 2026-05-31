import { NextResponse } from "next/server";
import { ensureAdminFromEnv, validateAdminCredentials, setAdminSessionCookie } from "@/lib/admin";

export async function POST(req: Request) {
    try {
        await ensureAdminFromEnv();

        const body = await req.json();
        const { email, password } = body as { email?: string; password?: string };

        console.log("Admin login attempt:", {
            emailFromClient: email,
            passwordLength: password ? password.length : 0,
            envEmail: process.env.ADMIN_EMAIL,
        });

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required." },
                { status: 400 }
            );
        }

        const isValid = await validateAdminCredentials(email, password);

        if (!isValid) {
            return NextResponse.json(
                { success: false, message: "Invalid admin email or password." },
                { status: 401 }
            );
        }

        await setAdminSessionCookie();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

