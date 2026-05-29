import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MCQ from "@/models/MCQ";
import Test from "@/models/Test";
import ClassAccess from "@/models/ClassAccess";
import TestSubmission from "@/models/TestSubmission";
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
        const subjectId = searchParams.get("subjectId");
        const testId = searchParams.get("testId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        if (!classId || !subjectId || !testId) {
            return NextResponse.json({ error: "classId, subjectId, and testId are required query parameters." }, { status: 400 });
        }

        if (page < 1 || limit < 1) {
            return NextResponse.json({ error: "Invalid page or limit values." }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Verify Class Access is Approved
        const access = await ClassAccess.findOne({
            userId: user._id,
            classId,
            status: "approved",
        }).lean();

        if (!access) {
            return NextResponse.json(
                { error: "Access denied. Class is locked." },
                { status: 403 }
            );
        }

        // 2. Verify sequential unlocking rules for the target testId
        const tests = await Test.find({
            subjectId,
            isDeleted: { $ne: true }
        })
            .sort({ name: 1, createdAt: 1 })
            .lean() as any[];

        const targetIndex = tests.findIndex((t) => t._id.toString() === testId);
        if (targetIndex === -1) {
            return NextResponse.json({ error: "Target test not found under this subject." }, { status: 404 });
        }

        if (targetIndex > 0) {
            // Check if the previous test was completed by this student
            const prevTestId = tests[targetIndex - 1]._id.toString();
            const completedPrev = await TestSubmission.findOne({
                userId: user._id,
                testId: prevTestId,
            }).lean();

            if (!completedPrev) {
                return NextResponse.json(
                    { error: "Access denied. You must complete the previous test first." },
                    { status: 403 }
                );
            }
        }

        // Query constraints: only non-deleted, matching classId, subjectId, and testId
        const query = {
            classId,
            subjectId,
            testId,
            isDeleted: { $ne: true }
        };

        // Paginated query
        // CRITICAL SECURITY: Project OUT correctAnswer field using .select("-correctAnswer")
        const [mcqs, totalCount] = await Promise.all([
            MCQ.find(query)
                .select("-correctAnswer")
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            MCQ.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            success: true,
            mcqs,
            totalCount,
            currentPage: page,
            totalPages,
        });
    } catch (err) {
        console.error("User MCQs GET error:", err);
        return NextResponse.json({ error: "Failed to retrieve MCQs." }, { status: 500 });
    }
}
