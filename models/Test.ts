import { Schema, model, models } from "mongoose";

const TestSchema = new Schema(
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
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
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

// High-performance querying indexes
TestSchema.index({ classId: 1 });
TestSchema.index({ subjectId: 1 });

// Prevent duplicate test names in the same subject
TestSchema.index(
    { name: 1, subjectId: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

const Test = models.Test || model("Test", TestSchema);

export default Test;
