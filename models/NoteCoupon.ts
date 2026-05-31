import { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

const NoteCouponSchema = new Schema(
    {
        classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: false, default: null },
        // First 8 chars of the raw code stored in plaintext for fast indexed lookup.
        // This is NOT a secret — it just narrows the query to one document so we
        // only run bcrypt.compare() once instead of scanning the whole collection.
        codePrefix: { type: String, required: true, index: true },
        hashedCoupon: { type: String, required: true },
        couponType: { type: String, enum: ["NOTE"], default: "NOTE" }, // Explicitly for NOTE only
        isUsed: { type: Boolean, default: false },
        usedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        usedAt: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Compound index: classId + codePrefix + isUsed covers the redemption query exactly
NoteCouponSchema.index({ classId: 1, codePrefix: 1, isUsed: 1 });
// For subject-scoped note coupon redemption
NoteCouponSchema.index({ classId: 1, subjectId: 1, codePrefix: 1, isUsed: 1 });

NoteCouponSchema.methods.compare = function (raw: string) {
    return bcrypt.compare(raw, this.hashedCoupon);
};

// Force re-registration in development so schema changes take effect on hot reload
if (process.env.NODE_ENV === "development" && models.NoteCoupon) {
    delete models.NoteCoupon;
}

const NoteCoupon = models.NoteCoupon || model("NoteCoupon", NoteCouponSchema);
export default NoteCoupon;
