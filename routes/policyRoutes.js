
const express = require("express");

const {
    searchPoliciesByUsername,
    getPoliciesByUser
} = require("../controllers/policyController");

const router = express.Router();

/**
 * @swagger
 * /api/policies/search/{username}:
 *   get:
 *     summary: Search policies by username
 *     tags: [Policies]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: User's name
 *     responses:
 *       200:
 *         description: Matching policies retrieved
 *       404:
 *         description: User not found
 */
router.get("/search/:username", searchPoliciesByUsername);

/**
 * @swagger
 * /api/policies/users/summary:
 *   get:
 *     summary: Get policies grouped by user
 *     tags: [Policies]
 *     responses:
 *       200:
 *         description: Policies grouped by each user
 */
router.get("/users/summary", getPoliciesByUser);

module.exports = router;
