import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import NoteCoupon from "@/models/NoteCoupon";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await connectToDatabase();
        const coupon = await NoteCoupon.findById(id);
        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
        }
        coupon.isActive = false;
        await coupon.save();
        return NextResponse.json({
            success: true,
            message: "Note coupon deactivated successfully.",
        });
    } catch (err) {
        console.error("Deactivate note coupon error:", err);
        return NextResponse.json({ error: "Failed to deactivate coupon." }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await connectToDatabase();
        const coupon = await NoteCoupon.findByIdAndDelete(id);
        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
        }
        return NextResponse.json({
            success: true,
            message: "Note coupon deleted successfully.",
        });
    } catch (err) {
        console.error("Delete note coupon error:", err);
        return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
    }
}
