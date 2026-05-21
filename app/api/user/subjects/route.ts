import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Subject from "@/models/Subject";
import ClassAccess from "@/models/ClassAccess";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        // Enforce user authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");

        if (!classId) {
            return NextResponse.json({ error: "classId query parameter is required." }, { status: 400 });
        }

        await connectToDatabase();

        // Security check: Check if user has approved class access
        const access = await ClassAccess.findOne({
            userId: user._id,
            classId,
            status: "approved",
        });

        if (!access) {
            return NextResponse.json(
                { error: "Access denied. This class is locked. Please unlock first." },
                { status: 403 }
            );
        }

        const subjects = await Subject.find({
            classId,
            isDeleted: { $ne: true }
        })
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            subjects,
        });
    } catch (err) {
        console.error("User Subjects GET error:", err);
        return NextResponse.json({ error: "Failed to retrieve subjects." }, { status: 500 });
    }
}
