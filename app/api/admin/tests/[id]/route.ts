import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Test from "@/models/Test";
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

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Test ID is required." },
                { status: 400 }
            );
        }

        const deleted = await Test.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Test not found." },
                { status: 404 }
            );
        }

        // Cascade soft delete to MCQs linked to this test
        await MCQ.updateMany(
            { testId: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        );

        return NextResponse.json(
            { success: true, message: "Test and its cascading MCQs soft-deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete test error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete test." },
            { status: 500 }
        );
    }
}
