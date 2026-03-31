const dotenv = require("dotenv");
const app = require("./app");
const {
  connectDB,
  disconnectDB,
  getConnectionStatus,
} = require("./db/connection");
const { initializeQueues } = require("./jobs/initializeQueues");

// ========== LOAD ENVIRONMENT VARIABLES ==========
dotenv.config();

// ========== VALIDATE ENVIRONMENT VARIABLES ==========
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "PORT"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ FATAL ERROR: Missing environment variables: ${missingEnvVars.join(", ")}`,
  );
  console.error("Please add them to .env file");
  process.exit(1);
}

console.log("✅ Environment variables validated");

// ========== CONNECT TO DATABASE ==========
console.log("🔌 Connecting to MongoDB...");
connectDB().catch((err) => {
  console.error("❌ Database connection failed:", err.message);
  process.exit(1);
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 RECIPE-FINDER API SERVER           ║
╚════════════════════════════════════════╝
📡 Server:      http://localhost:${PORT}
🌍 Environment: ${NODE_ENV}
⏰ Started:     ${new Date().toISOString()}
📚 Database:    Connected ✅
═════════════════════════════════════════
  `);

  // Initialize background job queues
  initializeQueues();
});

// ========== REQUEST TIMEOUT ==========
server.requestTimeout = 30000; // 30 seconds
server.headersTimeout = 35000; // 35 seconds

// ========== GRACEFUL SHUTDOWN ==========
const gracefulShutdown = (signal) => {
  console.log(`\n\n📛 ${signal} received. Shutting down gracefully...`);

  // Stop accepting new requests
  server.close(async () => {
    console.log("✅ HTTP server closed");

    try {
      // Close database connection
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error(
      "❌ Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ========== UNHANDLED ERRORS ==========
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Log but don't exit - allow server to continue
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Must exit on uncaught exceptions
  process.exit(1);
});

// ========== WARNINGS ==========
process.on("warning", (warning) => {
  console.warn("⚠️  Warning:", warning.name, warning.message);
});

// ========== PERFORMANCE MONITORING ==========
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(
    `[MONITOR] Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB | Uptime: ${(process.uptime() / 60).toFixed(2)}min`,
  );
}, 60000); // Every 60 seconds

module.exports = server;
