import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import NoteCoupon from "@/models/NoteCoupon";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        await connectToDatabase();
        const coupons = await NoteCoupon.find()
            .populate("classId", "name")
            .populate("subjectId", "name")
            .populate("usedBy", "name email")
            .sort({ createdAt: -1 })
            .lean();

        const formatted = coupons.map((c: any) => ({
            id: c._id.toString(),
            classId: c.classId?._id?.toString() || "",
            className: c.classId?.name || "Unknown",
            subjectId: c.subjectId?._id?.toString() || "",
            subjectName: c.subjectId?.name || "Unknown",
            isUsed: c.isUsed,
            isActive: c.isActive,
            usedBy: c.usedBy
                ? { name: c.usedBy.name, email: c.usedBy.email }
                : null,
            usedAt: c.usedAt ? c.usedAt.toISOString() : null,
            createdAt: c.createdAt.toISOString(),
        }));

        return NextResponse.json({ success: true, coupons: formatted });
    } catch (err) {
        console.error("Note coupons GET error:", err);
        return NextResponse.json({ error: "Failed to fetch note coupons." }, { status: 500 });
    }
}
