
const { Worker } = require("worker_threads");
const path = require("path");
const fs = require("fs");
const { beginImport, endImport } = require("../services/importActivity");

const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Please upload an XLSX or CSV file"
        });
    }

    beginImport();

    let worker;

    try {
        worker = new Worker(
            path.join(__dirname, "../workers/importWorker.js"),
            {
                workerData: {
                    filePath: req.file.path,
                    mongoUri: process.env.MONGO_URI
                }
            }
        );
    } catch (error) {
        endImport();
        console.error("Worker start error:", error);

        return res.status(500).json({
            success: false,
            message: "Import failed"
        });
    }

    let workerResult = null;
    let workerError = null;

    worker.on("message", (result) => {
        workerResult = result;
    });

    worker.on("error", (error) => {
        workerError = error;
    });

    worker.on("exit", (code) => {
        endImport();

        // Remove the temporary uploaded file.
        fs.unlink(req.file.path, (error) => {
            if (error) {
                console.error("Uploaded file cleanup error:", error.message);
            }
        });

        if (res.headersSent) return;

        if (workerError) {
            console.error("Import worker error:", workerError);
            return res.status(500).json({
                success: false,
                message: "Import failed"
            });
        }

        if (code !== 0 || !workerResult) {
            return res.status(500).json({
                success: false,
                message: "Worker stopped unexpectedly"
            });
        }

        if (workerResult.fatal) {
            return res.status(workerResult.statusCode || 500).json({
                success: false,
                message: workerResult.message || "Import failed"
            });
        }

        const statusCode = workerResult.success ? 200 : 207;

        return res.status(statusCode).json(workerResult);
    });
};

module.exports = { uploadFile };
