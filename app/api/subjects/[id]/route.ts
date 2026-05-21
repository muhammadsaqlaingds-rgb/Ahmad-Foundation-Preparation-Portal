import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
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

        const deleted = await Subject.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Subject not found." },
                { status: 404 }
            );
        }

        // Cascade soft delete to MCQs linked to this subject
        await MCQ.updateMany(
            { subjectId: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        );

        return NextResponse.json(
            { success: true, message: "Subject and its cascading MCQs soft-deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete subject error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete subject." },
            { status: 500 }
        );
    }
}
