import { Schema, model, models } from "mongoose";

const CourseSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Enforce unique course name (case-insensitive handled at API level)
CourseSchema.index({ name: 1 }, { unique: true });

const Course = models.Course || model("Course", CourseSchema);

export default Course;
