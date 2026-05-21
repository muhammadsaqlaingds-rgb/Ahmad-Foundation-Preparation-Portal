import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ClassAccess from "@/models/ClassAccess";
import "@/models/User";
import "@/models/Class";

export async function GET() {
    try {
        await connectToDatabase();

        const requests = await ClassAccess.find({})
            .populate("userId", "name email")
            .populate("classId", "name")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            requests,
        });
    } catch (err) {
        console.error("Admin payment requests error:", err);
        return NextResponse.json({ error: "Failed to load payment requests." }, { status: 500 });
    }
}
