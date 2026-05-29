import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Test from "@/models/Test";
import Subject from "@/models/Subject";
import ClassAccess from "@/models/ClassAccess";
import TestSubmission from "@/models/TestSubmission";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const subjectId = searchParams.get("subjectId");

        if (!subjectId) {
            return NextResponse.json({ error: "subjectId query parameter is required." }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Fetch the subject to find the classId
        const subject = await Subject.findOne({ _id: subjectId, isDeleted: { $ne: true } }).lean() as any;
        if (!subject) {
            return NextResponse.json({ error: "Subject not found." }, { status: 404 });
        }

        // 2. Verify that class access is approved
        const access = await ClassAccess.findOne({
            userId: user._id,
            classId: subject.classId,
            status: "approved",
        }).lean();

        if (!access) {
            return NextResponse.json(
                { error: "Access denied. Class is locked." },
                { status: 403 }
            );
        }

        // 3. Fetch all active tests for this subject, sorted alphabetically/sequentially by name
        const tests = await Test.find({
            subjectId,
            isDeleted: { $ne: true }
        })
            .sort({ name: 1, createdAt: 1 })
            .lean() as any[];

        // 4. Fetch all completed test submissions by this user for these tests
        const testIds = tests.map((t) => t._id);
        const submissions = await TestSubmission.find({
            userId: user._id,
            testId: { $in: testIds },
        }).lean();

        // Build a set of completed test IDs
        const completedTestIds = new Set<string>();
        submissions.forEach((sub: any) => {
            completedTestIds.add(sub.testId.toString());
        });

        // 5. Build sequential unlocking status
        // First test is unlocked by default. Subsequent test i is unlocked if test i-1 is completed.
        const testsWithLockStatus = tests.map((test, index) => {
            const isCompleted = completedTestIds.has(test._id.toString());
            let isUnlocked = false;

            if (index === 0) {
                isUnlocked = true; // First test is unlocked by default
            } else {
                // Unlocked only if the previous test was completed
                const prevTestId = tests[index - 1]._id.toString();
                if (completedTestIds.has(prevTestId)) {
                    isUnlocked = true;
                }
            }

            return {
                _id: test._id.toString(),
                name: test.name,
                isCompleted,
                isUnlocked,
            };
        });

        return NextResponse.json({
            success: true,
            tests: testsWithLockStatus,
        });
    } catch (err) {
        console.error("User Tests GET error:", err);
        return NextResponse.json({ error: "Failed to retrieve tests." }, { status: 500 });
    }
}
