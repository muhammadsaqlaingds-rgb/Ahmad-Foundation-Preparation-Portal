import { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

const NoteCouponSchema = new Schema(
    {
        classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: false, default: null },
        hashedCoupon: { type: String, required: true },
        isUsed: { type: Boolean, default: false },
        usedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        usedAt: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

NoteCouponSchema.methods.compare = function (raw: string) {
    return bcrypt.compare(raw, this.hashedCoupon);
};

// Force re-registration in development so schema changes take effect on hot reload
if (process.env.NODE_ENV === "development" && models.NoteCoupon) {
    delete models.NoteCoupon;
}

const NoteCoupon = models.NoteCoupon || model("NoteCoupon", NoteCouponSchema);
export default NoteCoupon;
