import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import ClassAccess from "@/models/ClassAccess";
import Class from "@/models/Class";
import { getCurrentUser } from "@/lib/auth";
import { extractCodePrefix } from "@/lib/coupon-code";

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

        // ── Step 1: use codePrefix index to fetch exactly ONE candidate ───────
        // Instead of loading all unused coupons and looping bcrypt over them,
        // we query by the indexed prefix — O(log n) instead of O(n * bcrypt).
        const codePrefix = extractCodePrefix(trimmedCode);
        const candidate = await Coupon.findOne({
            classId,
            codePrefix,
            isUsed: false,
            isActive: true,
            $or: [
                { couponType: "TEST" },
                { couponType: { $exists: false } },
            ],
        }).select("_id hashedCoupon");

        if (!candidate || !(await candidate.compare(trimmedCode))) {
            return NextResponse.json(
                { error: "Invalid or expired TEST coupon code. Note coupons cannot be used for tests." },
                { status: 400 }
            );
        }

        // ── Step 2: atomically claim — guards against concurrent redemption ───
        const claimed = await Coupon.findOneAndUpdate(
            { _id: candidate._id, isUsed: false, isActive: true },
            { $set: { isUsed: true, usedBy: user._id, usedAt: new Date() } },
            { new: true }
        );

        if (!claimed) {
            return NextResponse.json(
                { error: "This coupon has already been used. Please try a different code." },
                { status: 409 }
            );
        }

        // ── Step 3: grant class access ────────────────────────────────────────
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
