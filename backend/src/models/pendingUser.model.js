import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Holds a signup attempt until the user verifies their email with an OTP.
// Documents auto-delete 10 minutes after creation (see the index below),
// so an abandoned signup doesn't block that email/username forever.
const pendingUserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 600, // seconds = 10 minutes, MongoDB TTL auto-delete
        },
    }
);

pendingUserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

export const PendingUser = mongoose.model("PendingUser", pendingUserSchema);