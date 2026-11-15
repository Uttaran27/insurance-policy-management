
const ScheduledPost = require("../models/ScheduledPost");
const { parseScheduledInstant } = require("../utils/scheduleTime");

// Schedule a message for a particular date and time in IST (UTC+05:30).
const schedulePost = async (req, res) => {
    try {
        const message = typeof req.body.message === "string"
            ? req.body.message.trim()
            : "";
        const { day, time } = req.body;

        if (!message || !day || !time) {
            return res.status(400).json({
                success: false,
                message: "Message, day and time are required"
            });
        }

        const parsed = parseScheduledInstant(day, time);

        if (parsed.error) {
            return res.status(400).json({
                success: false,
                message: parsed.error
            });
        }

        const { scheduledAt } = parsed;

        if (scheduledAt <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a future date and time"
            });
        }

        const scheduledPost = await ScheduledPost.create({
            message,
            scheduledAt
        });

        console.log(
            `db scheduledposts insert id=${scheduledPost._id} scheduledAt=${scheduledPost.scheduledAt.toISOString()}`
        );

        return res.status(201).json({
            success: true,
            message: "Message scheduled successfully",
            data: scheduledPost
        });

    } catch (error) {
        console.error("Schedule post error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

module.exports = { schedulePost };
