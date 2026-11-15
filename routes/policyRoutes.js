
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
 *     summary: Search policies by exact username
 *     tags: [Policies]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Exact username
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Policies grouped by each user
 */
router.get("/users/summary", getPoliciesByUser);

module.exports = router;
