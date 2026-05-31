import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";
import { requireAdmin } from "@/lib/admin";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function PUT(req: Request, { params }: Params) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const { name } = body as { name?: string };

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: "Course name is required." },
                { status: 400 }
            );
        }

        const normalizedName = name.trim();

        const duplicate = await Course.findOne({
            _id: { $ne: id },
            name: new RegExp(`^${normalizedName}$`, "i"),
        });

        if (duplicate) {
            return NextResponse.json(
                { success: false, message: "Another course with this name already exists." },
                { status: 409 }
            );
        }

        const updated = await Course.findByIdAndUpdate(
            id,
            { name: normalizedName },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(
                { success: false, message: "Course not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updated }, { status: 200 });
    } catch (error) {
        console.error("Update course error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update course." },
            { status: 500 }
        );
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const { id } = await params;

        const deleted = await Course.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Course not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Delete course error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete course." },
            { status: 500 }
        );
    }
}

