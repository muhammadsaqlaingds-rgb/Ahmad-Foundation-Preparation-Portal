import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import "@/models/Class";
import "@/models/User";

export async function GET() {
    try {
        await connectToDatabase();

        const coupons = await Coupon.find({})
            .populate("classId", "name")
            .populate("usedBy", "name email")
            .sort({ createdAt: -1 })
            .lean();

        const list = coupons.map((c: any) => ({
            id: c._id.toString(),
            classId: c.classId?._id?.toString() || c.classId?.toString(),
            className: c.classId?.name || "Unknown",
            isUsed: c.isUsed,
            isActive: c.isActive,
            usedBy: c.usedBy
                ? { name: c.usedBy.name, email: c.usedBy.email }
                : null,
            usedAt: c.usedAt || null,
            createdAt: c.createdAt,
        }));

        return NextResponse.json({ success: true, coupons: list });
    } catch (err) {
        console.error("Admin coupons GET error:", err);
        return NextResponse.json({ error: "Failed to load coupons." }, { status: 500 });
    }
}
