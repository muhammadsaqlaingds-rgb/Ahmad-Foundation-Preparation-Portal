import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import ClassAccess from "@/models/ClassAccess";
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

        const existing = await ClassAccess.findOne({ userId: user._id, classId });
        if (existing?.status === "approved") {
            return NextResponse.json({
                success: true,
                message: "Class is already unlocked.",
                status: "approved",
            });
        }

        // ── Step 1: fetch candidates (read-only, no mutation) ─────────────────
        const candidates = await Coupon.find({
            classId,
            isUsed: false,
            isActive: true,
            $or: [
                { couponType: "TEST" },
                { couponType: { $exists: false } },
            ],
        }).select("_id hashedCoupon");

        // ── Step 2: find the matching coupon via bcrypt ───────────────────────
        let matchedId: string | null = null;
        for (const coupon of candidates) {
            if (await coupon.compare(trimmedCode)) {
                matchedId = coupon._id.toString();
                break;
            }
        }

        if (!matchedId) {
            return NextResponse.json(
                { error: "Invalid or expired TEST coupon code. Note coupons cannot be used for tests." },
                { status: 400 }
            );
        }

        // ── Step 3: atomically claim the coupon ───────────────────────────────
        // The filter includes isUsed: false — if a concurrent request already
        // claimed it between steps 1 and 3, this returns null and we reject.
        const claimed = await Coupon.findOneAndUpdate(
            { _id: matchedId, isUsed: false, isActive: true },
            { $set: { isUsed: true, usedBy: user._id, usedAt: new Date() } },
            { new: true }
        );

        if (!claimed) {
            return NextResponse.json(
                { error: "This coupon has already been used. Please try a different code." },
                { status: 409 }
            );
        }

        // ── Step 4: grant class access ────────────────────────────────────────
        if (existing) {
            existing.status = "approved";
            existing.paymentMethod = "coupon";
            existing.paymentDetails = "Unlocked via coupon code";
            await existing.save();
        } else {
            await ClassAccess.create({
                userId: user._id,
                classId,
                status: "approved",
                paymentMethod: "coupon",
                paymentDetails: "Unlocked via coupon code",
            });
        }

        return NextResponse.json({
            success: true,
            message: "Coupon redeemed successfully! Class unlocked.",
            status: "approved",
        });
    } catch (err) {
        console.error("Redeem coupon error:", err);
        return NextResponse.json({ error: "Failed to redeem coupon." }, { status: 500 });
    }
}
