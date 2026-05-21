import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ClassAccess from "@/models/ClassAccess";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        await connectToDatabase();
        
        // Find all approved classes for this user
        const accesses = await ClassAccess.find({ userId: user._id, status: "approved" }).lean();
        const approvedClassIds = accesses.map((acc: any) => acc.classId.toString());

        return NextResponse.json({
            success: true,
            approvedClassIds,
        });
    } catch (err) {
        console.error("Access Status GET error:", err);
        return NextResponse.json({ error: "Failed to retrieve access status." }, { status: 500 });
    }
}
