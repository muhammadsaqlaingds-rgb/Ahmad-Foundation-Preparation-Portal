import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MCQ from "@/models/MCQ";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import Test from "@/models/Test";

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);

        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
        const classId = searchParams.get("classId");
        const subjectId = searchParams.get("subjectId");
        const testId = searchParams.get("testId");
        const search = searchParams.get("search");

        const query: any = { isDeleted: { $ne: true } };

        if (classId) {
            query.classId = classId;
        }
        if (subjectId) {
            query.subjectId = subjectId;
        }
        if (testId) {
            query.testId = testId;
        }
        if (search && search.trim()) {
            query.question = new RegExp(search.trim(), "i");
        }

        const skip = (page - 1) * limit;

        const [mcqs, total] = await Promise.all([
            MCQ.find(query)
                .populate({
                    path: "classId",
                    match: { isDeleted: { $ne: true } },
                    select: "name",
                })
                .populate({
                    path: "subjectId",
                    match: { isDeleted: { $ne: true } },
                    select: "name",
                })
                .populate({
                    path: "testId",
                    match: { isDeleted: { $ne: true } },
                    select: "name",
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            MCQ.countDocuments(query),
        ]);

        // Filter out MCQs whose class, subject, or test is deleted
        const activeMcqs = mcqs.filter(
            (mcq) => mcq.classId !== null && mcq.subjectId !== null && mcq.testId !== null
        );

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json(
            {
                success: true,
                data: activeMcqs,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: totalPages,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Fetch MCQs error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load MCQs." },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { question, options, correctAnswer, classId, subjectId, testId } = body as {
            question?: string;
            options?: string[];
            correctAnswer?: number;
            classId?: string;
            subjectId?: string;
            testId?: string;
        };

        // Strict Validations
        if (!question || !question.trim()) {
            return NextResponse.json(
                { success: false, message: "Question text is required." },
                { status: 400 }
            );
        }

        if (!options || !Array.isArray(options) || options.length !== 4) {
            return NextResponse.json(
                { success: false, message: "Exactly 4 options are required." },
                { status: 400 }
            );
        }

        const cleanOptions = options.map((opt) => (opt ? opt.trim() : ""));
        if (cleanOptions.some((opt) => opt.length === 0)) {
            return NextResponse.json(
                { success: false, message: "All 4 options must be non-empty strings." },
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
                { success: false, message: "Correct answer must be an index from 0 to 3." },
                { status: 400 }
            );
        }

        if (!classId) {
            return NextResponse.json(
                { success: false, message: "Class ID is required." },
                { status: 400 }
            );
        }

        if (!subjectId) {
            return NextResponse.json(
                { success: false, message: "Subject ID is required." },
                { status: 400 }
            );
        }

        if (!testId) {
            return NextResponse.json(
                { success: false, message: "Test ID is required." },
                { status: 400 }
            );
        }

        // Verify class, subject & test exist and are active
        const parentClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!parentClass) {
            return NextResponse.json(
                { success: false, message: "Selected Class does not exist or is deleted." },
                { status: 404 }
            );
        }

        const parentSubject = await Subject.findOne({ _id: subjectId, isDeleted: { $ne: true } });
        if (!parentSubject) {
            return NextResponse.json(
                { success: false, message: "Selected Subject does not exist or is deleted." },
                { status: 404 }
            );
        }

        const parentTest = await Test.findOne({ _id: testId, isDeleted: { $ne: true } });
        if (!parentTest) {
            return NextResponse.json(
                { success: false, message: "Selected Test does not exist or is deleted." },
                { status: 404 }
            );
        }

        const normalizedQuestion = question.trim();

        // Check if MCQ with same question exists under this test
        const existing = await MCQ.findOne({
            testId,
            question: new RegExp(`^${normalizedQuestion.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i"),
        });

        if (existing) {
            if (existing.isDeleted) {
                // Restore
                existing.isDeleted = false;
                existing.deletedAt = null;
                existing.options = cleanOptions;
                existing.correctAnswer = correctAnswer;
                existing.classId = classId;
                existing.subjectId = subjectId;
                await existing.save();
                return NextResponse.json({ success: true, data: existing }, { status: 201 });
            }
            return NextResponse.json(
                { success: false, message: "This question already exists in this test." },
                { status: 409 }
            );
        }

        const created = await MCQ.create({
            question: normalizedQuestion,
            options: cleanOptions,
            correctAnswer,
            classId,
            subjectId,
            testId,
        });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error) {
        console.error("Create MCQ error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create MCQ." },
            { status: 500 }
        );
    }
}
