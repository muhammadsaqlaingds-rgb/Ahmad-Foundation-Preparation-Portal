import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
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
        const { classId, paymentMethod, paymentDetails } = body as {
            classId?: string;
            paymentMethod?: string;
            paymentDetails?: string;
        };

        if (!classId || !paymentMethod) {
            return NextResponse.json({ error: "classId and paymentMethod are required." }, { status: 400 });
        }

        await connectToDatabase();

        // Verify class exists
        const targetClass = await Class.findOne({ _id: classId, isDeleted: { $ne: true } });
        if (!targetClass) {
            return NextResponse.json({ error: "Class not found." }, { status: 404 });
        }

        // Check if access is already requested/approved
        const existing = await ClassAccess.findOne({ userId: user._id, classId });
        if (existing) {
            if (existing.status === "approved") {
                return NextResponse.json({ success: true, message: "Class is already unlocked.", status: "approved" });
            }
            if (existing.status === "pending") {
                return NextResponse.json({ error: "Access request is already pending approval.", status: "pending" }, { status: 409 });
            }
            // If rejected, allow request resubmission by updating it back to pending
            existing.status = "pending";
            existing.paymentMethod = paymentMethod;
            existing.paymentDetails = paymentDetails || "";
            await existing.save();
            return NextResponse.json({ success: true, message: "Access request resubmitted.", status: "pending" });
        }

        const newAccess = await ClassAccess.create({
            userId: user._id,
            classId,
            status: "pending",
            paymentMethod,
            paymentDetails: paymentDetails || "",
        });

        return NextResponse.json({
            success: true,
            message: "Access request submitted successfully.",
            data: newAccess,
        });
    } catch (err) {
        console.error("Request Access error:", err);
        return NextResponse.json({ error: "Failed to submit request." }, { status: 500 });
    }
}
