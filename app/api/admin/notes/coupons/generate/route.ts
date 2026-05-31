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
        const { classId, count } = body as { classId?: string; count?: number };

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

        // Generate all codes and hash them in parallel — no sequential awaits
        const rawCodes = Array.from({ length: count }, () => nanoid());
        const hashes = await Promise.all(rawCodes.map((code) => hashCouponCode(code)));

        const docs = rawCodes.map((code, i) => ({
            classId,
            codePrefix: extractCodePrefix(code),
            hashedCoupon: hashes[i],
            couponType: "NOTE" as const,
            isUsed: false,
            isActive: true,
        }));

        // Single round-trip to the DB instead of N sequential creates
        const inserted = await NoteCoupon.insertMany(docs);

        const generated = rawCodes.map((code, i) => ({
            id: inserted[i]._id.toString(),
            code,
            className: targetClass.name,
        }));

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
