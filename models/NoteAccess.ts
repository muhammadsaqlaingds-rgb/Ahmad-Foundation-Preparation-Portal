import { Schema, model, models } from "mongoose";

const NoteAccessSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        noteId: { type: Schema.Types.ObjectId, ref: "Note", required: true },
        classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        unlockedVia: { type: String, enum: ["coupon", "class_access"], default: "class_access" },
        unlockedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Ensure a user can only unlock a note once
NoteAccessSchema.index({ userId: 1, noteId: 1 }, { unique: true });

const NoteAccess = models.NoteAccess || model("NoteAccess", NoteAccessSchema);
export default NoteAccess;
