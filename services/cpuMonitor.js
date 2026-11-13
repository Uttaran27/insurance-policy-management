
const si = require("systeminformation");

const startCpuMonitor = () => {
    console.log("CPU monitoring started...");

    setInterval(async () => {
        try {
            const cpuData = await si.currentLoad();
            const cpuUsage = cpuData.currentLoad;

            console.log(`Current CPU Usage: ${cpuUsage.toFixed(2)}%`);

            if (cpuUsage >= 70) {
                console.log(
                    "CPU usage reached 70%. Restarting server..."
                );

                // PM2 will restart the application.
                process.exit(1);
            }
        } catch (error) {
            console.error("CPU monitoring error:", error.message);
        }
    }, 5000);
};

module.exports = startCpuMonitor;
