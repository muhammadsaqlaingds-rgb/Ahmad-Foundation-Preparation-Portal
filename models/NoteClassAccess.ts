import { Schema, model, models } from "mongoose";

const NoteClassAccessSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        classId: {
            type: Schema.Types.ObjectId,
            ref: "Class",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        paymentMethod: {
            type: String, // "easypaisa" | "jazzcash" | "whatsapp" | "coupon"
            required: true,
        },
        paymentDetails: {
            type: String, // transaction info or notes
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Unique index to prevent multiple concurrent requests for the same class by the same user
NoteClassAccessSchema.index({ userId: 1, classId: 1 }, { unique: true });

const NoteClassAccess = models.NoteClassAccess || model("NoteClassAccess", NoteClassAccessSchema);
export default NoteClassAccess;
