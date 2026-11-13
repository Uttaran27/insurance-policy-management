
const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
    {
        policyNumber: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        policyStartDate: Date,
        policyEndDate: Date,
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
