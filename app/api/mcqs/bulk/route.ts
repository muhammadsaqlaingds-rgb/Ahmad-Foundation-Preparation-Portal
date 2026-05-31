import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MCQ from "@/models/MCQ";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import Test from "@/models/Test";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { mcqs } = body as { mcqs?: any[] };

        if (!mcqs || !Array.isArray(mcqs) || mcqs.length === 0) {
            return NextResponse.json(
                { success: false, message: "MCQs array is required and cannot be empty." },
                { status: 400 }
            );
        }

        // ── Pass 1: structural validation (no DB) ─────────────────────────────
        const seenQuestions = new Set<string>();
        const classIds = new Set<string>();
        const subjectIds = new Set<string>();
        const testIds = new Set<string>();

        for (let i = 0; i < mcqs.length; i++) {
            const item = mcqs[i];
            const { question, options, correctAnswer, classId, subjectId, testId } = item;

            if (!question || !question.trim()) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Question text is required.` },
                    { status: 400 }
                );
            }
            if (!options || !Array.isArray(options) || options.length !== 4) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Exactly 4 options are required.` },
                    { status: 400 }
                );
            }
            const cleanOptions = options.map((opt: any) => (opt ? String(opt).trim() : ""));
            if (cleanOptions.some((opt: string) => opt.length === 0)) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: All 4 options must be non-empty strings.` },
                    { status: 400 }
                );
            }
            if (
                correctAnswer === undefined ||
                correctAnswer === null ||
                typeof correctAnswer !== "number" ||
                correctAnswer < 0 ||
                correctAnswer > 3
            ) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Correct answer must be index 0 to 3.` },
                    { status: 400 }
                );
            }
            if (!classId) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Class ID is required.` },
                    { status: 400 }
                );
            }
            if (!subjectId) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Subject ID is required.` },
                    { status: 400 }
                );
            }
            if (!testId) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Test ID is required.` },
                    { status: 400 }
                );
            }

            // Payload-level duplicate check (no DB needed)
            const uniqKey = `${testId}::${question.trim().toLowerCase()}`;
            if (seenQuestions.has(uniqKey)) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Duplicate question found in this bulk payload.` },
                    { status: 409 }
                );
            }
            seenQuestions.add(uniqKey);

            classIds.add(classId);
            subjectIds.add(subjectId);
            testIds.add(testId);
        }

        // ── Pass 2: batch-validate all referenced IDs — 3 parallel queries ────
        // Instead of N sequential findOne calls inside the loop, fetch all
        // referenced documents in one $in query per collection.
        const testIdArray = [...testIds];

        const [validClasses, validSubjects, validTests, existingMcqs] = await Promise.all([
            Class.find({ _id: { $in: [...classIds] }, isDeleted: { $ne: true } })
                .select("_id").lean(),
            Subject.find({ _id: { $in: [...subjectIds] }, isDeleted: { $ne: true } })
                .select("_id").lean(),
            Test.find({ _id: { $in: testIdArray }, isDeleted: { $ne: true } })
                .select("_id").lean(),
            // Fetch all existing questions for the referenced tests in one query
            MCQ.find({
                testId: { $in: testIdArray },
                isDeleted: { $ne: true },
            }).select("testId question").lean(),
        ]);

        const validClassSet = new Set(validClasses.map((c: any) => c._id.toString()));
        const validSubjectSet = new Set(validSubjects.map((s: any) => s._id.toString()));
        const validTestSet = new Set(validTests.map((t: any) => t._id.toString()));

        // Build a Set of "testId::question_lower" for O(1) duplicate detection
        const existingKeys = new Set(
            existingMcqs.map((m: any) => `${m.testId.toString()}::${m.question.trim().toLowerCase()}`)
        );

        // ── Pass 3: per-item validation against pre-fetched sets ──────────────
        const validMcqs: any[] = [];

        for (let i = 0; i < mcqs.length; i++) {
            const { question, options, correctAnswer, classId, subjectId, testId } = mcqs[i];
            const normalizedQuestion = question.trim();

            if (!validClassSet.has(classId)) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Selected Class is invalid or deleted.` },
                    { status: 400 }
                );
            }
            if (!validSubjectSet.has(subjectId)) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Selected Subject is invalid or deleted.` },
                    { status: 400 }
                );
            }
            if (!validTestSet.has(testId)) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Selected Test is invalid or deleted.` },
                    { status: 400 }
                );
            }

            const dbKey = `${testId}::${normalizedQuestion.toLowerCase()}`;
            if (existingKeys.has(dbKey)) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Question already exists in database under this test.` },
                    { status: 409 }
                );
            }

            const cleanOptions = options.map((opt: any) => String(opt).trim());
            validMcqs.push({ question: normalizedQuestion, options: cleanOptions, correctAnswer, classId, subjectId, testId });
        }

        const inserted = await MCQ.insertMany(validMcqs);

        return NextResponse.json(
            {
                success: true,
                message: `Successfully uploaded ${inserted.length} MCQs!`,
                data: inserted,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Bulk upload MCQs error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to upload MCQs in bulk." },
            { status: 500 }
        );
    }
}
