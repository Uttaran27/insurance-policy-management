
const cron = require("node-cron");

const ScheduledPost = require("../models/ScheduledPost");
const Message = require("../models/Message");

const processScheduledPosts = async () => {
    try {
        while (true) {
            // Claim one pending message whose scheduled time has arrived
            const scheduledPost = await ScheduledPost.findOneAndUpdate(
                {
                    status: "pending",
                    scheduledAt: { $lte: new Date() }
                },
                {
                    $set: { status: "processing" }
                },
                {
                    // new: true,
                    returnDocument:'after',
                    sort: { scheduledAt: 1 }
                }
            );

            // No more due messages
            if (!scheduledPost) {
                break;
            }

            try {
                await Message.create({
                    message: scheduledPost.message,
                    scheduledPostId: scheduledPost._id,
                    executedAt: new Date()
                });

                await ScheduledPost.findByIdAndUpdate(
                    scheduledPost._id,
                    { $set: { status: "completed" } }
                );

                console.log(
                    `Scheduled message executed: ${scheduledPost._id}`
                );

            } catch (error) {
                await ScheduledPost.findByIdAndUpdate(
                    scheduledPost._id,
                    { $set: { status: "failed" } }
                );

                console.error("Message execution failed:", error.message);
            }
        }
    } catch (error) {
        console.error("Scheduler error:", error.message);
    }
};

const startScheduler = () => {
    // Check every 10 seconds for messages that are due
    cron.schedule("*/10 * * * * *", processScheduledPosts);

    console.log("Message scheduler started");
};

module.exports = startScheduler;
