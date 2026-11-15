const crypto = require("crypto");

const requireApiKey = (req, res, next) => {
    const configured = process.env.API_KEY;

    if (!configured) {
        console.error("API_KEY is not set. Refusing API request.");
        return res.status(500).json({
            success: false,
            message: "API key is not configured"
        });
    }

    const provided = req.get("x-api-key") || "";
    const left = Buffer.from(provided);
    const right = Buffer.from(configured);

    const matches = left.length === right.length
        && crypto.timingSafeEqual(left, right);

    if (!matches) {
        return res.status(401).json({
            success: false,
            message: "Invalid API key"
        });
    }

    return next();
};

module.exports = requireApiKey;
