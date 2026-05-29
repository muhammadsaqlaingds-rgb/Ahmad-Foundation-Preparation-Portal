import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        // 1. IP-Based Rate Limiting (Max 5 attempts per minute)
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const limitCheck = await isRateLimited(ip, 5, 60);
        if (limitCheck.limited) {
            return NextResponse.json(
                { error: `Too many registration attempts. Please retry after ${limitCheck.retryAfter} seconds.` },
                { status: 429, headers: { "Retry-After": String(limitCheck.retryAfter) } }
            );
        }

        const body = await req.json();
        const { email, password, name } = body;

        // 2. Strict Input Validation
        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedPassword = password?.trim();
        const trimmedName = name?.trim();

        if (!trimmedEmail || !trimmedPassword || !trimmedName) {
            return NextResponse.json({ error: "Name, email, and password are required fields." }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return NextResponse.json({ error: "Please enter a valid email address format." }, { status: 400 });
        }

        if (trimmedPassword.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
        }

        // 3. Database Check
        await connectToDatabase();
        const existingUser = await User.findOne({ email: trimmedEmail, isDeleted: { $ne: true } });
        if (existingUser) {
            return NextResponse.json({ error: "An account with this email address already exists." }, { status: 400 });
        }

        // 4. Create User and Session
        const { salt, hash } = hashPassword(trimmedPassword);
        const newUser = await User.create({
            name: trimmedName,
            email: trimmedEmail,
            passwordHash: hash,
            salt,
        });

        await setSessionCookie({
            userId: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (err) {
        console.error("Register API error:", err);
        return NextResponse.json({ error: "An error occurred during registration. Please try again." }, { status: 500 });
    }
}
