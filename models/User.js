const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firstname: { type: String, trim: true },
        username: { type: String, trim: true, lowercase: true },
        dob: Date,
        address: String,
        phone: String,
        state: String,
        zip: String,
        city: String,
        email: { type: String, trim: true, lowercase: true },
        gender: String,
        userType: String,
        primary: String,
        applicant_id: String,
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

userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema, "users");
