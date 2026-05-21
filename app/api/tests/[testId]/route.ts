import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TestSubmission from "@/models/TestSubmission";
// Make sure referenced models are loaded in Mongoose registry
import "@/models/Class";
import "@/models/Subject";
import "@/models/Test";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ testId: string }> }
) {
    try {
        // 1. Session Authentication Check
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        const { testId } = await params;
        if (!testId) {
            return NextResponse.json({ error: "testId parameter is required." }, { status: 400 });
        }

        await connectToDatabase();

        // 2. Fetch Submission and Populate Names
        const submission = await TestSubmission.findById(testId)
            .populate("classId", "name")
            .populate("subjectId", "name")
            .populate("testId", "name")
            .lean() as any;

        if (!submission) {
            return NextResponse.json({ error: "Test submission not found." }, { status: 404 });
        }

        // 3. Security Check: Block reading other student's exam sheet
        if (submission.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: "Access denied. You can only view your own results." }, { status: 403 });
        }

        // 4. Strict Security: Return ONLY high-level stats, hiding correctAnswers/wrong keys
        return NextResponse.json({
            success: true,
            summary: {
                testId: submission._id.toString(),
                totalQuestions: submission.totalQuestions,
                attemptedCount: submission.attemptedCount,
                score: submission.score,
                percentage: submission.percentage,
                durationSeconds: submission.durationSeconds,
                className: submission.classId?.name || "Unknown Class",
                subjectName: submission.testId?.name
                    ? `${submission.subjectId?.name || "Unknown Subject"} (${submission.testId.name})`
                    : submission.subjectId?.name || "Unknown Subject",
                createdAt: submission.createdAt,
            },
        });
    } catch (err) {
        console.error("Get Result API error:", err);
        return NextResponse.json({ error: "Failed to retrieve results summary." }, { status: 500 });
    }
}
