import mongoose, { Schema, model, models } from "mongoose";

const AdminSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // Stores a bcrypt hash — never a plaintext password
    passwordHash: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

AdminSchema.pre("save", function () {
    // @ts-ignore
    this.updatedAt = new Date();
});

const Admin = models.Admin || model("Admin", AdminSchema);

export default Admin;

