const si = require("systeminformation");
const { hasActiveImport } = require("./importActivity");

const cpuRestartEnabled = () =>
    process.env.ENABLE_CPU_RESTART === "true" || process.env.pm_id !== undefined;

const startCpuMonitor = () => {
    if (!cpuRestartEnabled()) {
        console.log(
            "CPU restart is disabled. Run under PM2 or set ENABLE_CPU_RESTART=true to exit at 70% CPU."
        );
        return;
    }

    console.log("CPU monitoring started...");

    let checking = false;

    setInterval(async () => {
        if (checking) {
            return;
        }

        checking = true;

        try {
            const cpuData = await si.currentLoad();
            const cpuUsage = cpuData.currentLoad;

            console.log(`Current CPU Usage: ${cpuUsage.toFixed(2)}%`);

            if (cpuUsage < 70) {
                return;
            }

            if (hasActiveImport()) {
                console.log(
                    "CPU usage reached 70% during an import. Skipping restart."
                );
                return;
            }

            console.log("CPU usage reached 70%. Restarting server...");

            // PM2, or another supervisor started with ENABLE_CPU_RESTART, restarts the app.
            process.exit(1);
        } catch (error) {
            console.error("CPU monitoring error:", error.message);
        } finally {
            checking = false;
        }
    }, 5000);
};

module.exports = startCpuMonitor;
