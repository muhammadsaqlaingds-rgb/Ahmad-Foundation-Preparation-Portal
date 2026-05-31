import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        const { id } = await params;
        await connectToDatabase();

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
        }

        coupon.isActive = false;
        await coupon.save();

        return NextResponse.json({ success: true, message: "Coupon deactivated." });
    } catch (err) {
        console.error("Admin coupon deactivate error:", err);
        return NextResponse.json({ error: "Failed to deactivate coupon." }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
    try {
        const { id } = await params;
        await connectToDatabase();

        const result = await Coupon.findByIdAndDelete(id);
        if (!result) {
            return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Coupon deleted." });
    } catch (err) {
        console.error("Admin coupon delete error:", err);
        return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
    }
}
