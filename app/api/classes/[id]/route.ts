import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import MCQ from "@/models/MCQ";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function DELETE(_req: Request, { params }: Params) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const deleted = await Class.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Class not found." },
                { status: 404 }
            );
        }

        // Cascade soft delete to Subjects and MCQs linked to this class
        await Subject.updateMany(
            { classId: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        );

        await MCQ.updateMany(
            { classId: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        );

        return NextResponse.json(
            { success: true, message: "Class and its cascading relations soft-deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete class error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete class." },
            { status: 500 }
        );
    }
}
