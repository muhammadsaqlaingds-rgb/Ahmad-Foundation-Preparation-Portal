import { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

const CouponSchema = new Schema(
    {
        classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
        hashedCoupon: { type: String, required: true },
        couponType: { type: String, enum: ["TEST"], default: "TEST" }, // Explicitly for TEST only
        isUsed: { type: Boolean, default: false },
        usedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        usedAt: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CouponSchema.methods.compare = function (raw: string) {
    return bcrypt.compare(raw, this.hashedCoupon);
};

// Force re-registration in development so schema changes take effect on hot reload
if (process.env.NODE_ENV === "development" && models.Coupon) {
    delete models.Coupon;
}

const Coupon = models.Coupon || model("Coupon", CouponSchema);

(Coupon as any).dropStaleIndexes = async function () {
    try {
        await Coupon.collection.dropIndex("codeHash_1");
    } catch (err: any) {
        // code 27 / IndexNotFound means it was already gone — that's fine
        if (err?.code !== 27 && err?.codeName !== "IndexNotFound") {
            console.warn("Coupon: could not drop stale codeHash_1 index:", err?.message);
        }
    }
};

export default Coupon;

