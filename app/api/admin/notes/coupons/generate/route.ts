import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import NoteCoupon from "@/models/NoteCoupon";
import Class from "@/models/Class";
import { customAlphabet } from "nanoid";
import { hashCouponCode, extractCodePrefix } from "@/lib/coupon-code";
import { requireAdmin } from "@/lib/admin";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export async function POST(req: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        const body = await req.json();
        const { classId, count } = body as {
            classId?: string;
            count?: number;
        };

        if (!classId || !count || count < 1 || count > 50) {
            return NextResponse.json(
                { error: "Valid classId and count (1-50) are required." },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const targetClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!targetClass) {
            return NextResponse.json({ error: "Class not found." }, { status: 404 });
        }

        const generated: { id: string; code: string; className: string }[] = [];

        for (let i = 0; i < count; i++) {
            const code = nanoid();
            const codePrefix = extractCodePrefix(code);
            const hashedCoupon = await hashCouponCode(code);
            const coupon = await NoteCoupon.create({
                classId,
                codePrefix,
                hashedCoupon,
                couponType: "NOTE",
                isUsed: false,
                isActive: true,
            });
            generated.push({
                id: coupon._id.toString(),
                code,
                className: targetClass.name,
            });
        }

        return NextResponse.json({
            success: true,
            message: `${count} note coupon(s) generated successfully.`,
            coupons: generated,
        });
    } catch (err) {
        console.error("Generate note coupons error:", err);
        return NextResponse.json({ error: "Failed to generate coupons." }, { status: 500 });
    }
}
