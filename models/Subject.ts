import { Schema, model, models } from "mongoose";

const SubjectSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        classId: {
            type: Schema.Types.ObjectId,
            ref: "Class",
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Fast relations index
SubjectSchema.index({ classId: 1 });

// Enforce unique name per class for non-deleted subjects
SubjectSchema.index(
    { name: 1, classId: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

const Subject = models.Subject || model("Subject", SubjectSchema);

export default Subject;
