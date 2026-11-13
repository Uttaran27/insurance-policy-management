
const ScheduledPost = require("../models/ScheduledPost");

// Schedule a message for a particular date and time
const schedulePost = async (req, res) => {
    try {
        const { message, day, time } = req.body;

        if (!message || !day || !time) {
            return res.status(400).json({
                success: false,
                message: "Message, day and time are required"
            });
        }

        // Validate the expected date and time formats
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
        ) {
            return res.status(400).json({
                success: false,
                message: "Use day format YYYY-MM-DD and time format HH:mm"
            });
        }

        // Interpret the supplied date and time as Indian Standard Time
        const scheduledAt = new Date(`${day}T${time}:00+05:30`);

        if (
            Number.isNaN(scheduledAt.getTime()) ||
            scheduledAt.toISOString().slice(0, 10) !== day
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid date"
            });
        }

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

        return res.status(201).json({
            success: true,
            message: "Message scheduled successfully",
            data: scheduledPost
        });

    } catch (error) {
        console.error("Schedule post error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { schedulePost };
