import { Schema, model, models } from "mongoose";

const MCQSchema = new Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        options: {
            type: [String],
            required: true,
            validate: {
                validator: function (val: string[]) {
                    return val.length === 4 && val.every((opt) => opt && opt.trim().length > 0);
                },
                message: "MCQ must have exactly 4 non-empty options.",
            },
        },
        correctAnswer: {
            type: Number, // 0, 1, 2, or 3 representing index
            required: true,
            min: 0,
            max: 3,
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
        testId: {
            type: Schema.Types.ObjectId,
            ref: "Test",
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
MCQSchema.index({ classId: 1 });
MCQSchema.index({ subjectId: 1 });
MCQSchema.index({ testId: 1 });

// Prevent duplicate MCQs in the same test
MCQSchema.index(
    { question: 1, testId: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

const MCQ = models.MCQ || model("MCQ", MCQSchema);

export default MCQ;
