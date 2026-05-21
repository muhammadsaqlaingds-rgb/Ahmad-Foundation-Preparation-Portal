import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Course from "@/models/Course";

export async function GET() {
    try {
        await connectToDatabase();
        const courses = await Course.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: courses }, { status: 200 });
    } catch (error) {
        console.error("Fetch courses error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load courses." },
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
                { success: false, message: "Course name is required." },
                { status: 400 }
            );
        }

        const normalizedName = name.trim();

        const existing = await Course.findOne({
            name: new RegExp(`^${normalizedName}$`, "i"),
        });

        if (existing) {
            return NextResponse.json(
                { success: false, message: "A course with this name already exists." },
                { status: 409 }
            );
        }

        const created = await Course.create({ name: normalizedName });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error) {
        console.error("Create course error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create course." },
            { status: 500 }
        );
    }
}

