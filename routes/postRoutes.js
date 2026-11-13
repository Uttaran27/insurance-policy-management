
const express = require("express");

const {
    schedulePost
} = require("../controllers/postController");

const router = express.Router();

/**
 * @swagger
 * /api/posts/schedule:
 *   post:
 *     summary: Schedule a message for a particular date and time
 *     tags: [Scheduled Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - day
 *               - time
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hello, this is a scheduled message
 *               day:
 *                 type: string
 *                 example: "2026-11-15"
 *               time:
 *                 type: string
 *                 example: "14:30"
 *     responses:
 *       201:
 *         description: Message scheduled successfully
 *       400:
 *         description: Invalid request
 */
router.post("/schedule", schedulePost);

module.exports = router;
