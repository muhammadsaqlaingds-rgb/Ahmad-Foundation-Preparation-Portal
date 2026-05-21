import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    try {
        await connectToDatabase();
        const users = await User.find({ isDeleted: { $ne: true } })
            .select("-passwordHash -salt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            users,
        });
    } catch (err) {
        console.error("Admin list users error:", err);
        return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
    }
}
