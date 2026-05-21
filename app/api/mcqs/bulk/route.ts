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

        const validMcqs: any[] = [];
        const seenQuestions = new Set<string>();

        // Cache checks to prevent repetitive database calls
        const classCache = new Map<string, boolean>();
        const subjectCache = new Map<string, boolean>();
        const testCache = new Map<string, boolean>();

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
            if (cleanOptions.some((opt) => opt.length === 0)) {
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

            // Validate Class
            let classExists = classCache.get(classId);
            if (classExists === undefined) {
                const parentClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
                classExists = !!parentClass;
                classCache.set(classId, classExists);
            }
            if (!classExists) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Selected Class is invalid or deleted.` },
                    { status: 400 }
                );
            }

            // Validate Subject
            let subjectExists = subjectCache.get(subjectId);
            if (subjectExists === undefined) {
                const parentSubject = await Subject.findOne({ _id: subjectId, isDeleted: { $ne: true } });
                subjectExists = !!parentSubject;
                subjectCache.set(subjectId, subjectExists);
            }
            if (!subjectExists) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Selected Subject is invalid or deleted.` },
                    { status: 400 }
                );
            }

            // Validate Test
            let testExists = testCache.get(testId);
            if (testExists === undefined) {
                const parentTest = await Test.findOne({ _id: testId, isDeleted: { $ne: true } });
                testExists = !!parentTest;
                testCache.set(testId, testExists);
            }
            if (!testExists) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Selected Test is invalid or deleted.` },
                    { status: 400 }
                );
            }

            const normalizedQuestion = question.trim();
            const uniqKey = `${testId}::${normalizedQuestion.toLowerCase()}`;

            // Check payload duplicate
            if (seenQuestions.has(uniqKey)) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Duplicate question found in this bulk payload.` },
                    { status: 400 }
                );
            }
            seenQuestions.add(uniqKey);

            // Check database duplicate
            const existing = await MCQ.findOne({
                testId,
                question: new RegExp(`^${normalizedQuestion.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i"),
                isDeleted: { $ne: true },
            });

            if (existing) {
                return NextResponse.json(
                    { success: false, message: `Item #${i + 1}: Question already exists in database under this test.` },
                    { status: 409 }
                );
            }

            validMcqs.push({
                question: normalizedQuestion,
                options: cleanOptions,
                correctAnswer,
                classId,
                subjectId,
                testId,
            });
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
