import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import NoteCoupon from "@/models/NoteCoupon";
import Class from "@/models/Class";
import Subject from "@/models/Subject";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { classId, subjectId, count } = body as {
            classId?: string;
            subjectId?: string;
            count?: number;
        };

        if (!classId || !subjectId || !count || count < 1 || count > 50) {
            return NextResponse.json(
                { error: "Valid classId, subjectId, and count (1-50) are required." },
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

        const generated: { id: string; code: string; className: string; subjectName: string }[] = [];

        for (let i = 0; i < count; i++) {
            const code = nanoid();
            const hashedCoupon = await bcrypt.hash(code, 10);
            const coupon = await NoteCoupon.create({
                classId,
                subjectId,
                hashedCoupon,
                isUsed: false,
                isActive: true,
            });
            generated.push({
                id: coupon._id.toString(),
                code,
                className: targetClass.name,
                subjectName: targetSubject.name,
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
