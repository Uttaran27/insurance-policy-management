const cron = require("node-cron");

const ScheduledPost = require("../models/ScheduledPost");
const Message = require("../models/Message");

// A claim older than this is returned to pending so a crash mid-send
// does not leave the message stuck in "processing".
const STALE_PROCESSING_MS = 2 * 60 * 1000;

let running = false;

const isDuplicateKey = (error) =>
    error?.code === 11000 || error?.cause?.code === 11000;

const processScheduledPosts = async () => {
    if (running) {
        return;
    }

    running = true;

    try {
        const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);

        const resetResult = await ScheduledPost.updateMany(
            {
                status: "processing",
                $or: [
                    { updatedAt: { $lte: staleBefore } },
                    { updatedAt: { $exists: false } }
                ]
            },
            { $set: { status: "pending" } }
        );

        if (resetResult.modifiedCount > 0) {
            console.log(
                `db scheduledposts updateMany modified=${resetResult.modifiedCount}`
            );
        }

        while (true) {
            // Claim one pending message whose scheduled time has arrived.
            const scheduledPost = await ScheduledPost.findOneAndUpdate(
                {
                    status: "pending",
                    scheduledAt: { $lte: new Date() }
                },
                { $set: { status: "processing" } },
                {
                    returnDocument: "after",
                    sort: { scheduledAt: 1 }
                }
            );

            if (!scheduledPost) {
                break;
            }

            try {
                await Message.create({
                    message: scheduledPost.message,
                    scheduledPostId: scheduledPost._id,
                    executedAt: new Date()
                });

                await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
                    $set: { status: "completed" }
                });

                console.log(`Scheduled message executed: ${scheduledPost._id}`);
            } catch (error) {
                // The message was inserted, then the process died before
                // the status update. The unique scheduledPostId rejects
                // a second insert, so mark the original row completed.
                if (isDuplicateKey(error)) {
                    await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
                        $set: { status: "completed" }
                    });

                    console.log(
                        `Scheduled message already executed: ${scheduledPost._id}`
                    );
                    continue;
                }

                await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
                    $set: { status: "failed" }
                });

                console.error(
                    `Message execution failed: ${scheduledPost._id}`,
                    error.message
                );
            }
        }
    } catch (error) {
        console.error("Scheduler error:", error.message);
    } finally {
        running = false;
    }
};

const startScheduler = () => {
    // Check every 10 seconds for messages that are due.
    // Overlapping ticks are ignored while a batch is still running.
    cron.schedule("*/10 * * * * *", () => {
        processScheduledPosts();
    });

    console.log("Message scheduler started");
};

module.exports = startScheduler;
