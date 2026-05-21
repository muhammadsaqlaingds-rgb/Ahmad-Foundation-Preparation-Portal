import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        // 1. IP-Based Rate Limiting (Max 5 attempts per minute)
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const limitCheck = isRateLimited(ip, 5, 60);
        if (limitCheck.limited) {
            return NextResponse.json(
                { error: `Too many login attempts. Please try again in ${limitCheck.retryAfter} seconds.` },
                { status: 429, headers: { "Retry-After": String(limitCheck.retryAfter) } }
            );
        }

        const body = await req.json();
        const { email, password } = body;

        // 2. Input Validation
        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedPassword = password?.trim();

        if (!trimmedEmail || !trimmedPassword) {
            return NextResponse.json({ error: "Email and password are required fields." }, { status: 400 });
        }

        // 3. Authenticate User
        await connectToDatabase();
        const user = await User.findOne({ email: trimmedEmail, isDeleted: { $ne: true } });

        if (!user) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }

        const isPasswordCorrect = verifyPassword(trimmedPassword, user.salt, user.passwordHash);
        if (!isPasswordCorrect) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }

        // 4. Create Session Cookie
        await setSessionCookie({
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error("Login API error:", err);
        return NextResponse.json({ error: "An error occurred during sign in. Please try again." }, { status: 500 });
    }
}
