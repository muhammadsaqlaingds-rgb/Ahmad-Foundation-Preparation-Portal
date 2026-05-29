import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MCQ from "@/models/MCQ";
import TestSubmission from "@/models/TestSubmission";
import { getCurrentUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        // 1. IP-Based Rate Limiting (Max 3 submissions per minute)
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const limitCheck = await isRateLimited(ip, 3, 60);
        if (limitCheck.limited) {
            return NextResponse.json(
                { error: `Too many submission attempts. Please try again after ${limitCheck.retryAfter} seconds.` },
                { status: 429, headers: { "Retry-After": String(limitCheck.retryAfter) } }
            );
        }

        // 2. Session Authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in to submit a test." }, { status: 401 });
        }

        const body = await req.json();
        const { classId, subjectId, testId, startTime, answers } = body;

        // 3. Strict Input Validation
        if (!classId || !subjectId || !testId || !startTime || !Array.isArray(answers)) {
            return NextResponse.json({ error: "Invalid test submission payload." }, { status: 400 });
        }

        await connectToDatabase();

        // 4. Cheat-Proof Scoring Process (Deduplicated to prevent multiple grading of the same question)
        const gradedMcqIds = new Set<string>();
        const uniqueAnswers = answers.filter((ans: any) => {
            if (!ans.mcqId) return false;
            const mcqIdStr = String(ans.mcqId);
            if (gradedMcqIds.has(mcqIdStr)) return false;
            gradedMcqIds.add(mcqIdStr);
            return true;
        });

        const mcqIds = uniqueAnswers.map((ans: any) => ans.mcqId);
        const dbMcqs = await MCQ.find({
            _id: { $in: mcqIds },
            classId,
            subjectId,
            testId,
            isDeleted: { $ne: true }
        }).lean();

        if (dbMcqs.length === 0) {
            return NextResponse.json({ error: "No active questions found matching the submission." }, { status: 400 });
        }

        const mcqMap = new Map<string, number>();
        dbMcqs.forEach((mcq: any) => {
            mcqMap.set(mcq._id.toString(), mcq.correctAnswer);
        });

        let score = 0;
        let attemptedCount = 0;

        uniqueAnswers.forEach((ans: any) => {
            const mcqIdStr = ans.mcqId;
            const selectedOpt = ans.selectedOption;

            if (mcqMap.has(mcqIdStr)) {
                // If student actually selected a choice (0-3)
                if (selectedOpt !== null && selectedOpt !== undefined && selectedOpt >= 0 && selectedOpt <= 3) {
                    attemptedCount += 1;
                    const correctAnswer = mcqMap.get(mcqIdStr);
                    if (selectedOpt === correctAnswer) {
                        score += 1;
                    }
                }
            }
        });

        const totalQuestions = dbMcqs.length;
        const percentage = parseFloat(((score / totalQuestions) * 100).toFixed(2));

        // 5. Anti-Tampering Duration Verification
        const startTimestamp = new Date(startTime).getTime();
        const endTimestamp = Date.now();
        let durationSeconds = Math.ceil((endTimestamp - startTimestamp) / 1000);

        if (isNaN(durationSeconds) || durationSeconds < 0) {
            durationSeconds = 0;
        }

        // 6. Save or Update Test Submission Record (Supports Retakes)
        let submission;
        const existingSubmission = await TestSubmission.findOne({
            userId: user._id,
            testId,
        });

        if (existingSubmission) {
            existingSubmission.classId = classId;
            existingSubmission.subjectId = subjectId;
            existingSubmission.totalQuestions = totalQuestions;
            existingSubmission.attemptedCount = attemptedCount;
            existingSubmission.score = score;
            existingSubmission.percentage = percentage;
            existingSubmission.startTime = new Date(startTime);
            existingSubmission.submittedAt = new Date(endTimestamp);
            existingSubmission.durationSeconds = durationSeconds;
            // Update createdAt to float the retaken attempt to the top of the student's dashboard history
            existingSubmission.createdAt = new Date(endTimestamp);
            existingSubmission.answers = uniqueAnswers.map((ans: any) => ({
                mcqId: ans.mcqId,
                selectedOption: ans.selectedOption,
            }));
            submission = await existingSubmission.save();
        } else {
            submission = await TestSubmission.create({
                userId: user._id,
                classId,
                subjectId,
                testId,
                totalQuestions,
                attemptedCount,
                score,
                percentage,
                startTime: new Date(startTime),
                submittedAt: new Date(endTimestamp),
                durationSeconds,
                answers: uniqueAnswers.map((ans: any) => ({
                    mcqId: ans.mcqId,
                    selectedOption: ans.selectedOption,
                })),
            });
        }

        return NextResponse.json({
            success: true,
            testId: submission._id.toString(),
        });
    } catch (err) {
        console.error("Submit Test API error:", err);
        return NextResponse.json({ error: "Failed to submit test. Please try again." }, { status: 500 });
    }
}
