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
        const { classId, subjectId, code } = body as { classId?: string; subjectId?: string; code?: string };

        const trimmedCode = code?.trim().toUpperCase();
        if (!classId || !subjectId || !trimmedCode) {
            return NextResponse.json({ error: "Class, subject, and coupon code are required." }, { status: 400 });
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

        // Find matching coupon
        const candidates = await NoteCoupon.find({
            classId,
            subjectId,
            isUsed: false,
            isActive: true,
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
            return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
        }

        // Mark coupon as used
        matched.isUsed = true;
        matched.usedBy = user._id;
        matched.usedAt = new Date();
        await matched.save();

        // Grant access to all notes in this class/subject
        const Note = (await import("@/models/Note")).default;
        const notes = await Note.find({
            classId,
            subjectId,
            isDeleted: { $ne: true },
        }).select("_id");

        // Create note access records for all notes
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
