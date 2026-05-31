import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import Class from "@/models/Class";
import { generateCouponCode, hashCouponCode, extractCodePrefix } from "@/lib/coupon-code";
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

        // Generate all codes and hash them in parallel — no sequential awaits
        const rawCodes = Array.from({ length: num }, () => generateCouponCode());
        const hashes = await Promise.all(rawCodes.map((code) => hashCouponCode(code)));

        const docs = rawCodes.map((code, i) => ({
            classId,
            codePrefix: extractCodePrefix(code),
            hashedCoupon: hashes[i],
            couponType: "TEST" as const,
            isUsed: false,
            isActive: true,
        }));

        // Single round-trip to the DB instead of N sequential creates
        const inserted = await Coupon.insertMany(docs);

        const created = rawCodes.map((code, i) => ({
            id: inserted[i]._id.toString(),
            code,
            className: targetClass.name,
        }));

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
