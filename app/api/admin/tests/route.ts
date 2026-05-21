import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Test from "@/models/Test";
import Class from "@/models/Class";
import Subject from "@/models/Subject";

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");
        const subjectId = searchParams.get("subjectId");

        const query: any = { isDeleted: { $ne: true } };
        if (classId) query.classId = classId;
        if (subjectId) query.subjectId = subjectId;

        const tests = await Test.find(query)
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
            .sort({ name: 1 })
            .lean();

        // Filter out tests whose parent class or subject is deleted
        const activeTests = tests.filter((t) => t.classId !== null && t.subjectId !== null);

        return NextResponse.json({ success: true, data: activeTests }, { status: 200 });
    } catch (error) {
        console.error("Fetch tests error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load tests." },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { name, classId, subjectId } = body as { name?: string; classId?: string; subjectId?: string };

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: "Test name is required." },
                { status: 400 }
            );
        }

        if (!classId || !subjectId) {
            return NextResponse.json(
                { success: false, message: "Class ID and Subject ID are required." },
                { status: 400 }
            );
        }

        const normalizedName = name.trim();

        // Verify class & subject exist
        const parentClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!parentClass) {
            return NextResponse.json(
                { success: false, message: "Class does not exist or is deleted." },
                { status: 404 }
            );
        }

        const parentSubject = await Subject.findOne({ _id: subjectId, isDeleted: { $ne: true } });
        if (!parentSubject) {
            return NextResponse.json(
                { success: false, message: "Subject does not exist or is deleted." },
                { status: 404 }
            );
        }

        // Check duplicate test name under this subject
        const existing = await Test.findOne({
            subjectId,
            name: new RegExp(`^${normalizedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i"),
        });

        if (existing) {
            if (existing.isDeleted) {
                existing.isDeleted = false;
                existing.deletedAt = null;
                existing.classId = classId;
                await existing.save();
                return NextResponse.json({ success: true, data: existing }, { status: 201 });
            }
            return NextResponse.json(
                { success: false, message: "A test with this name already exists in this subject." },
                { status: 409 }
            );
        }

        const created = await Test.create({
            name: normalizedName,
            classId,
            subjectId,
        });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error) {
        console.error("Create test error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create test." },
            { status: 500 }
        );
    }
}
