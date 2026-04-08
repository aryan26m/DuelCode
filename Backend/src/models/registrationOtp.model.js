const mongoose = require("mongoose");

const registrationOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
        },
        passwordHash: {
            type: String,
            required: [true, "Password hash is required"],
        },
        cfHandle: {
            type: String,
            required: [true, "Codeforces handle is required"],
            trim: true,
        },
        otpHash: {
            type: String,
            required: [true, "OTP hash is required"],
        },
        otpExpiresAt: {
            type: Date,
            required: [true, "OTP expiry is required"],
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

registrationOtpSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

const registrationOtpModel = mongoose.model("registrationOtp", registrationOtpSchema);

module.exports = registrationOtpModel;
