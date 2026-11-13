
const express = require("express");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const uploadRoutes = require("./routes/uploadRoutes");
const policyRoutes = require("./routes/policyRoutes");
const postRoutes = require("./routes/postRoutes");

const app = express();

app.use((req, res, next) => {
    console.log("INCOMING REQUEST:", req.method, req.originalUrl);
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/upload", uploadRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Insurance Policy Management API is running"
    });
});

module.exports = app;
