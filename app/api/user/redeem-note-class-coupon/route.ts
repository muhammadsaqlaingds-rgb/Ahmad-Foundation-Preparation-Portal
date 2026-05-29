import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import NoteCoupon from "@/models/NoteCoupon";
import NoteClassAccess from "@/models/NoteClassAccess";
import Class from "@/models/Class";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        const body = await req.json();
        const { classId, code } = body as { classId?: string; code?: string };

        const trimmedCode = code?.trim().toUpperCase();
        if (!classId || !trimmedCode) {
            return NextResponse.json({ error: "Class and coupon code are required." }, { status: 400 });
        }

        await connectToDatabase();

        const targetClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!targetClass) {
            return NextResponse.json({ error: "Class not found." }, { status: 404 });
        }

        const existing = await NoteClassAccess.findOne({ userId: user._id, classId });
        if (existing?.status === "approved") {
            return NextResponse.json({
                success: true,
                message: "Class notes are already unlocked.",
                status: "approved",
            });
        }

        // Find note coupons for this class (any subject)
        const candidates = await NoteCoupon.find({
            classId,
            isUsed: false,
            isActive: true,
            couponType: "NOTE", // Only allow NOTE coupons for note access
        });

        let matched: (typeof candidates)[number] | null = null;
        for (const coupon of candidates) {
            const isMatch = await coupon.compare(trimmedCode);
            if (isMatch) {
                matched = coupon;
                break;
            }
        }

        if (!matched) {
            return NextResponse.json({ error: "Invalid or expired NOTE coupon code. Test coupons cannot be used for notes." }, { status: 400 });
        }

        matched.isUsed = true;
        matched.usedBy = user._id;
        matched.usedAt = new Date();
        await matched.save();

        if (existing) {
            existing.status = "approved";
            existing.paymentMethod = "coupon";
            existing.paymentDetails = "Unlocked via note coupon code";
            await existing.save();
        } else {
            await NoteClassAccess.create({
                userId: user._id,
                classId,
                status: "approved",
                paymentMethod: "coupon",
                paymentDetails: "Unlocked via note coupon code",
            });
        }

        return NextResponse.json({
            success: true,
            message: "Coupon redeemed successfully! Class notes unlocked.",
            status: "approved",
        });
    } catch (err) {
        console.error("Redeem note class coupon error:", err);
        return NextResponse.json({ error: "Failed to redeem coupon." }, { status: 500 });
    }
}
