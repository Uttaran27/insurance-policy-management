const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
    {
        policy_number: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        policy_start_date: Date,
        policy_end_date: Date,
        policy_mode: Number,
        producer: { type: String, trim: true },
        premium_amount: Number,
        policy_type: { type: String, trim: true },
        csr: { type: String, trim: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LOB"
        },
        carrierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Carrier"
        }
    },
    { timestamps: true }
);

policySchema.index({ userId: 1 });

module.exports = mongoose.model("Policy", policySchema, "policies");
