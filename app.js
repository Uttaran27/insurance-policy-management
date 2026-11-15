const express = require("express");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const requireApiKey = require("./middleware/requireApiKey");
const errorHandler = require("./middleware/errorHandler");

const uploadRoutes = require("./routes/uploadRoutes");
const policyRoutes = require("./routes/policyRoutes");
const postRoutes = require("./routes/postRoutes");

const app = express();

const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

allowedOrigins.add("http://localhost:5000");
allowedOrigins.add("http://127.0.0.1:5000");

app.use((req, res, next) => {
    console.log("INCOMING REQUEST:", req.method, req.path);
    next();
});

// Allow non-browser clients, the host serving this API (Swagger),
// and origins listed in CORS_ORIGINS.
app.use((req, res, next) => {
    const origin = req.get("origin");

    if (!origin) {
        return cors({ origin: true })(req, res, next);
    }

    let sameHost = false;

    try {
        sameHost = new URL(origin).host === req.get("host");
    } catch (error) {
        sameHost = false;
    }

    if (sameHost || allowedOrigins.has(origin)) {
        return cors({ origin: true })(req, res, next);
    }

    return res.status(403).json({
        success: false,
        message: "Origin is not allowed"
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation stays readable without an API key.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", requireApiKey);
app.use("/api/upload", uploadRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Insurance Policy Management API is running"
    });
});

app.use(errorHandler);

module.exports = app;
