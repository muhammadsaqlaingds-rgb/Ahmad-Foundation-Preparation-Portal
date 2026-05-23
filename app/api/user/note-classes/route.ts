import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Class from "@/models/Class";
import NoteClassAccess from "@/models/NoteClassAccess";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        // Enforce user authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch all active classes
        const classes = await Class.find({ isDeleted: { $ne: true } })
            .sort({ name: 1 })
            .lean();

        // Fetch all note class access entries for the current user
        const accesses = await NoteClassAccess.find({ userId: user._id }).lean();
        const accessMap = new Map<string, string>();
        accesses.forEach((acc: any) => {
            accessMap.set(acc.classId.toString(), acc.status);
        });

        const classesWithStatus = classes.map((cls: any) => ({
            _id: cls._id.toString(),
            name: cls.name,
            status: accessMap.get(cls._id.toString()) || "locked", // "locked", "pending", "approved", or "rejected"
        }));

        return NextResponse.json({
            success: true,
            classes: classesWithStatus,
        });
    } catch (err) {
        console.error("User Note Classes GET error:", err);
        return NextResponse.json({ error: "Failed to retrieve classes." }, { status: 500 });
    }
}
