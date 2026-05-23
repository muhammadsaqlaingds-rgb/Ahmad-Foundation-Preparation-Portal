import { Schema, model, models } from "mongoose";

const NoteSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        imageUrl: { type: String }, // optional URL to an image
        pdfUrl: { type: String, required: true }, // URL or path to stored PDF
        classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        requiresCoupon: { type: Boolean, default: false }, // Whether this note requires coupon redemption
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },
    },
    { timestamps: true }
);

// Prevent duplicate note names for the same class/subject when not deleted
NoteSchema.index(
    { name: 1, classId: 1, subjectId: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Note = models.Note || model("Note", NoteSchema);
export default Note;
