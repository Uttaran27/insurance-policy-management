
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const startScheduler = require("./services/scheduler");
const startCpuMonitor = require("./services/cpuMonitor");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        startScheduler();
        startCpuMonitor();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
