
const mongoose = require("mongoose");

const scheduledPostSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true
        },

        scheduledAt: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

scheduledPostSchema.index({ status: 1, scheduledAt: 1 });
scheduledPostSchema.index({ status: 1, updatedAt: 1 });

module.exports = mongoose.model(
    "ScheduledPost",
    scheduledPostSchema,
    "scheduledposts"
);
