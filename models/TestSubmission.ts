import { Schema, model, models } from "mongoose";

const TestSubmissionSchema = new Schema(
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
        totalQuestions: {
            type: Number,
            required: true,
        },
        attemptedCount: {
            type: Number,
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
        percentage: {
            type: Number,
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        submittedAt: {
            type: Date,
            required: true,
        },
        durationSeconds: {
            type: Number,
            required: true,
        },
        answers: [
            {
                mcqId: {
                    type: Schema.Types.ObjectId,
                    ref: "MCQ",
                    required: true,
                },
                selectedOption: {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 3,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// High performance query indexes
TestSubmissionSchema.index({ userId: 1 });
TestSubmissionSchema.index({ classId: 1 });
TestSubmissionSchema.index({ subjectId: 1 });
TestSubmissionSchema.index({ testId: 1 });
TestSubmissionSchema.index({ userId: 1, testId: 1 });

const TestSubmission = models.TestSubmission || model("TestSubmission", TestSubmissionSchema);

export default TestSubmission;
