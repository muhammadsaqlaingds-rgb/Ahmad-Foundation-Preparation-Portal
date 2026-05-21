import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Class from "@/models/Class";

export async function GET() {
    try {
        await connectToDatabase();
        const classes = await Class.find({ isDeleted: { $ne: true } })
            .sort({ name: 1 })
            .lean();
        return NextResponse.json({ success: true, data: classes }, { status: 200 });
    } catch (error) {
        console.error("Fetch classes error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load classes." },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { name } = body as { name?: string };

        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, message: "Class name is required." },
                { status: 400 }
            );
        }

        const normalizedName = name.trim();

        // Check if class with same name exists (case-insensitive)
        const existing = await Class.findOne({
            name: new RegExp(`^${normalizedName}$`, "i"),
        });

        if (existing) {
            if (existing.isDeleted) {
                // If it was soft-deleted, restore it
                existing.isDeleted = false;
                existing.deletedAt = null;
                await existing.save();
                return NextResponse.json({ success: true, data: existing }, { status: 201 });
            }
            return NextResponse.json(
                { success: false, message: "A class with this name already exists." },
                { status: 409 }
            );
        }

        const created = await Class.create({ name: normalizedName });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error) {
        console.error("Create class error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create class." },
            { status: 500 }
        );
    }
}
