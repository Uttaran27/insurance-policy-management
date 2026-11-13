
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firstName: { type: String, trim: true },
        username: { type: String, trim: true, lowercase: true },
        DOB: Date,
        address: String,
        phone: String,
        state: String,
        zipCode: String,
        email: { type: String, trim: true, lowercase: true },
        gender: String,
        userType: String,
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agent"
        },
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account"
        }
    },
    { timestamps: true }
);

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema, "users");
