import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TestSubmission from "@/models/TestSubmission";
import "@/models/Class";
import "@/models/Subject";
import "@/models/Test";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        // Enforce user session authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        await connectToDatabase();

        // Retrieve student submissions, sorted by newest first
        const submissions = await TestSubmission.find({ userId: user._id })
            .populate("classId", "name")
            .populate("subjectId", "name")
            .populate("testId", "name")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean() as any[];

        const formatted = submissions.map((sub) => ({
            id: sub._id.toString(),
            className: sub.classId?.name || "Class Deleted",
            subjectName: sub.testId?.name
                ? `${sub.subjectId?.name || "Subject Deleted"} (${sub.testId.name})`
                : sub.subjectId?.name || "Subject Deleted",
            score: sub.score,
            totalQuestions: sub.totalQuestions,
            percentage: sub.percentage,
            durationSeconds: sub.durationSeconds,
            createdAt: sub.createdAt,
        }));

        return NextResponse.json({
            success: true,
            submissions: formatted,
        });
    } catch (err) {
        console.error("User Submissions GET error:", err);
        return NextResponse.json({ error: "Failed to retrieve test history." }, { status: 500 });
    }
}
