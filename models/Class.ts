import { Schema, model, models } from "mongoose";

const ClassSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
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

// Enforce unique name for non-deleted classes
ClassSchema.index(
    { name: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

const Class = models.Class || model("Class", ClassSchema);

export default Class;
