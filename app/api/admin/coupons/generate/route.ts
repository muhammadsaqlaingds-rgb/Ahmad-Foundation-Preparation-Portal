import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import Class from "@/models/Class";
import { generateCouponCode, hashCouponCode } from "@/lib/coupon-code";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        const body = await req.json();
        const { classId, count = 1 } = body as { classId?: string; count?: number };

        if (!classId) {
            return NextResponse.json({ error: "classId is required." }, { status: 400 });
        }

        const num = Math.min(Math.max(Number(count) || 1, 1), 50);

        await connectToDatabase();
        await (Coupon as any).dropStaleIndexes();

        const targetClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!targetClass) {
            return NextResponse.json({ error: "Class not found." }, { status: 404 });
        }

        const created: { id: string; code: string; className: string }[] = [];

        for (let i = 0; i < num; i++) {
            const code = generateCouponCode();
            const hashedCoupon = await hashCouponCode(code);
            const doc = await Coupon.create({
                classId,
                hashedCoupon,
                couponType: "TEST", // Explicitly set as TEST coupon
                isUsed: false,
                isActive: true,
            });
            created.push({
                id: doc._id.toString(),
                code,
                className: targetClass.name,
            });
        }

        return NextResponse.json({
            success: true,
            message: `Generated ${created.length} coupon(s) for Class ${targetClass.name}.`,
            coupons: created,
        });
    } catch (err) {
        console.error("Admin coupons generate error:", err);
        return NextResponse.json({ error: "Failed to generate coupons." }, { status: 500 });
    }
}
