import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import MCQ from "@/models/MCQ";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import Test from "@/models/Test";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function PUT(req: Request, { params }: Params) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const { question, options, correctAnswer, classId, subjectId, testId } = body as {
            question?: string;
            options?: string[];
            correctAnswer?: number;
            classId?: string;
            subjectId?: string;
            testId?: string;
        };

        // Validate existence of target MCQ
        const targetMcq = await MCQ.findOne({ _id: id, isDeleted: { $ne: true } });
        if (!targetMcq) {
            return NextResponse.json(
                { success: false, message: "MCQ not found." },
                { status: 404 }
            );
        }

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

        // Check for duplicate question under this test (excluding current MCQ)
        const duplicate = await MCQ.findOne({
            _id: { $ne: id },
            testId,
            question: new RegExp(`^${normalizedQuestion.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i"),
            isDeleted: { $ne: true },
        });

        if (duplicate) {
            return NextResponse.json(
                { success: false, message: "Another active MCQ with this question already exists in this test." },
                { status: 409 }
            );
        }

        const updated = await MCQ.findByIdAndUpdate(
            id,
            {
                question: normalizedQuestion,
                options: cleanOptions,
                correctAnswer,
                classId,
                subjectId,
                testId,
            },
            { new: true }
        );

        return NextResponse.json({ success: true, data: updated }, { status: 200 });
    } catch (error) {
        console.error("Update MCQ error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update MCQ." },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const deleted = await MCQ.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "MCQ not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "MCQ soft-deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete MCQ error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete MCQ." },
            { status: 500 }
        );
    }
}
