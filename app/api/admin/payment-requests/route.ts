import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ClassAccess from "@/models/ClassAccess";
import "@/models/User";
import "@/models/Class";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();

        const requests = await ClassAccess.find({})
            .populate("userId", "name email")
            .populate("classId", "name")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            requests,
        });
    } catch (err) {
        console.error("Admin payment requests error:", err);
        return NextResponse.json({ error: "Failed to load payment requests." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const body = await req.json();
        const { accessId, status } = body as { accessId?: string; status?: "approved" | "rejected" };

        if (!accessId || !status || !["approved", "rejected"].includes(status)) {
            return NextResponse.json({ error: "accessId and valid status are required." }, { status: 400 });
        }

        const access = await ClassAccess.findById(accessId);
        if (!access) {
            return NextResponse.json({ error: "Access request not found." }, { status: 404 });
        }

        access.status = status;
        await access.save();

        return NextResponse.json({ success: true, message: `Access request ${status} successfully.`, data: access });
    } catch (err) {
        console.error("Admin approve payment request error:", err);
        return NextResponse.json({ error: "Failed to update payment request." }, { status: 500 });
    }
}

