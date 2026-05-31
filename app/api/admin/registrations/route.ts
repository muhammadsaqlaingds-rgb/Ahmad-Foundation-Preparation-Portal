import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TestSubmission from "@/models/TestSubmission";
// Load models in Mongoose registry
import "@/models/User";
import "@/models/Class";
import "@/models/Subject";
import "@/models/Test";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        
        // Fetch all test submissions, populated with student, class, subject, and test details
        const submissions = await TestSubmission.find({})
            .populate("userId", "name email")
            .populate("classId", "name")
            .populate("subjectId", "name")
            .populate("testId", "name")
            .sort({ createdAt: -1 })
            .lean() as any[];

        const formatted = submissions.map((sub) => ({
            _id: sub._id.toString(),
            name: sub.userId?.name || "Deleted Student",
            email: sub.userId?.email || "N/A",
            createdAt: sub.createdAt,
            title: `${sub.classId?.name || "Class"} - ${sub.subjectId?.name || "Subject"} - ${sub.testId?.name || "Test"}`,
            score: sub.score,
            totalQuestions: sub.totalQuestions,
            percentage: sub.percentage,
            durationSeconds: sub.durationSeconds,
        }));

        return NextResponse.json({ success: true, data: formatted }, { status: 200 });
    } catch (error) {
        console.error("Fetch submissions error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load test submissions." },
            { status: 500 }
        );
    }
}
