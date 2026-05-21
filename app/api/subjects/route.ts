import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Class from "@/models/Class";

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");

        const query: any = { isDeleted: { $ne: true } };
        if (classId) {
            query.classId = classId;
        }

        const subjects = await Subject.find(query)
            .populate({
                path: "classId",
                match: { isDeleted: { $ne: true } },
                select: "name",
            })
            .sort({ name: 1 })
            .lean();

        // Filter out subjects whose parent class is deleted (if classId filter was not provided and populate returned null classId)
        const activeSubjects = subjects.filter((subj) => subj.classId !== null);

        return NextResponse.json({ success: true, data: activeSubjects }, { status: 200 });
    } catch (error) {
        console.error("Fetch subjects error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load subjects." },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { name, classId } = body as { name?: string; classId?: string };

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: "Subject name is required." },
                { status: 400 }
            );
        }

        if (!classId) {
            return NextResponse.json(
                { success: false, message: "Class ID is required." },
                { status: 400 }
            );
        }

        const normalizedName = name.trim();

        // Verify Class exists and is not soft-deleted
        const parentClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!parentClass) {
            return NextResponse.json(
                { success: false, message: "Selected Class does not exist or is deleted." },
                { status: 404 }
            );
        }

        // Check if subject with same name exists under this class (case-insensitive)
        const existing = await Subject.findOne({
            classId,
            name: new RegExp(`^${normalizedName}$`, "i"),
        });

        if (existing) {
            if (existing.isDeleted) {
                // If soft-deleted, restore it
                existing.isDeleted = false;
                existing.deletedAt = null;
                await existing.save();
                return NextResponse.json({ success: true, data: existing }, { status: 201 });
            }
            return NextResponse.json(
                { success: false, message: "A subject with this name already exists in this class." },
                { status: 409 }
            );
        }

        const created = await Subject.create({
            name: normalizedName,
            classId,
        });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error) {
        console.error("Create subject error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create subject." },
            { status: 500 }
        );
    }
}
