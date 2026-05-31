import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import NoteCoupon from "@/models/NoteCoupon";
import NoteAccess from "@/models/NoteAccess";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        const body = await req.json();
        const { classId, subjectId, code } = body as {
            classId?: string;
            subjectId?: string;
            code?: string;
        };

        const trimmedCode = code?.trim().toUpperCase();
        if (!classId || !subjectId || !trimmedCode) {
            return NextResponse.json(
                { error: "Class, subject, and coupon code are required." },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const targetClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!targetClass) {
            return NextResponse.json({ error: "Class not found." }, { status: 404 });
        }

        const targetSubject = await Subject.findOne({ _id: subjectId, isDeleted: { $ne: true } });
        if (!targetSubject) {
            return NextResponse.json({ error: "Subject not found." }, { status: 404 });
        }

        // ── Step 1: fetch candidates (read-only, no mutation) ─────────────────
        const candidates = await NoteCoupon.find({
            classId,
            subjectId,
            isUsed: false,
            isActive: true,
            couponType: "NOTE",
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
                { error: "Invalid or expired NOTE coupon code. Test coupons cannot be used for notes." },
                { status: 400 }
            );
        }

        // ── Step 3: atomically claim the coupon ───────────────────────────────
        // The filter includes isUsed: false — if a concurrent request already
        // claimed it between steps 1 and 3, this returns null and we reject.
        const claimed = await NoteCoupon.findOneAndUpdate(
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

        // ── Step 4: grant access to all notes in this class/subject ──────────
        const Note = (await import("@/models/Note")).default;
        const notes = await Note.find({
            classId,
            subjectId,
            isDeleted: { $ne: true },
        }).select("_id");

        const accessPromises = notes.map((note: any) =>
            NoteAccess.findOneAndUpdate(
                { userId: user._id, noteId: note._id },
                {
                    userId: user._id,
                    noteId: note._id,
                    classId,
                    subjectId,
                    unlockedVia: "coupon",
                    unlockedAt: new Date(),
                },
                { upsert: true, new: true }
            )
        );

        await Promise.all(accessPromises);

        return NextResponse.json({
            success: true,
            message: `Coupon redeemed! All notes for ${targetClass.name} - ${targetSubject.name} are now unlocked.`,
        });
    } catch (err) {
        console.error("Redeem note coupon error:", err);
        return NextResponse.json({ error: "Failed to redeem coupon." }, { status: 500 });
    }
}
