
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { uploadFile } = require("../controllers/uploadController");

const router = express.Router();

// Create uploads directory automatically if it does not exist
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// Allow only Excel and CSV files
const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".xlsx", ".csv"];

    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
        cb(null, true);
    } else {
        cb(new Error("Only Excel (.xlsx) and CSV (.csv) files are allowed!"));
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    }
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload an Excel or CSV file
 *     description: Upload and process insurance policy data using Worker Threads.
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel (.xlsx) or CSV (.csv) file
 *     responses:
 *       200:
 *         description: File processed successfully
 *       400:
 *         description: Invalid file
 *       500:
 *         description: Processing failed
 */

// Upload endpoint
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
