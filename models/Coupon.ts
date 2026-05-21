import { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

const CouponSchema = new Schema(
    {
        classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
        hashedCoupon: { type: String, required: true },
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

const Coupon = models.Coupon || model("Coupon", CouponSchema);
export default Coupon;
