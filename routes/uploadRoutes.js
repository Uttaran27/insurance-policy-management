
const express = require("express");
const multer = require("multer");
const path = require("path");

const { uploadFile } = require("../controllers/uploadController");

const router = express.Router();

// Configure where uploaded files will be stored
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + file.originalname;

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
        cb(new Error("Only XLSX and CSV files are allowed"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload an Excel or CSV file
 *     tags: [File Upload]
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
 *     responses:
 *       200:
 *         description: File processed successfully
 *       400:
 *         description: Invalid file
 *       500:
 *         description: Processing failed
 */
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
