
const { Worker } = require("worker_threads");
const path = require("path");
const fs = require("fs");

const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Please upload an XLSX or CSV file"
        });
    }

    const worker = new Worker(
        path.join(__dirname, "../workers/importWorker.js"),
        {
            workerData: {
                filePath: req.file.path,
                mongoUri: process.env.MONGO_URI
            }
        }
    );

    let workerResult = null;
    let workerError = null;

    worker.on("message", (result) => {
        workerResult = result;
    });

    worker.on("error", (error) => {
        workerError = error;
    });

    worker.on("exit", (code) => {
        // Remove the temporary uploaded file.
        fs.unlink(req.file.path, (error) => {
            if (error) {
                console.error("Uploaded file cleanup error:", error.message);
            }
        });

        if (res.headersSent) return;

        if (workerError) {
            return res.status(500).json({
                success: false,
                message: workerError.message
            });
        }

        if (code !== 0 || !workerResult) {
            return res.status(500).json({
                success: false,
                message: "Worker stopped unexpectedly"
            });
        }

        const statusCode = workerResult.success ? 200 : 207;

        return res.status(statusCode).json(workerResult);
    });
};

module.exports = { uploadFile };
