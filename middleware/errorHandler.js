const multer = require("multer");

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "File exceeds the 10 MB limit"
            : "Upload rejected";

        return res.status(400).json({
            success: false,
            message
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Request body must be valid JSON"
        });
    }

    const status = Number(err.status) || 500;

    if (status >= 500) {
        console.error("Unhandled error:", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }

    return res.status(status).json({
        success: false,
        message: err.message || "Request failed"
    });
};

module.exports = errorHandler;
