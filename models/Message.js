
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true
        },

        scheduledPostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ScheduledPost",
            required: true,
            unique: true
        },

        executedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Message",
    messageSchema,
    "messages"
);
