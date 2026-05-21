import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TestSubmission from "@/models/TestSubmission";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function DELETE(
    _req: Request,
    { params }: Params
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Submission ID is required." },
                { status: 400 }
            );
        }

        const deleted = await TestSubmission.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Submission not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: deleted }, { status: 200 });
    } catch (error) {
        console.error("Delete submission error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete submission." },
            { status: 500 }
        );
    }
}
