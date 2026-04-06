// ========== CORE DEPENDENCIES ==========
const dotenv = require("dotenv"); // Load environment variables from .env
const app = require("./app"); // The configured Express application

// ========== DATABASE & QUEUE IMPORTS ==========
const { connectDB, disconnectDB, getConnectionStatus } = require("./config/db"); // MongoDB connection functions
const { initializeQueues } = require("./jobs/initializeQueues"); // Background job queue initialization

// ========== LOAD ENVIRONMENT VARIABLES ==========
// dotenv.config() reads .env file and adds variables to process.env
dotenv.config();

// ========== VALIDATE REQUIRED ENVIRONMENT VARIABLES ==========
// These variables are essential for the app to run
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "PORT"];

// Filter out only the missing environment variables
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

// If any required variables are missing, exit immediately (fail-fast approach)
if (missingEnvVars.length > 0) {
  // Print all missing variables to help developer fix the issue
  console.error(
    `❌ FATAL ERROR: Missing environment variables: ${missingEnvVars.join(", ")}`,
  );
  console.error("Please add them to .env file"); // Helpful instruction
  process.exit(1); // Exit with error code 1
}

console.log("✅ Environment variables validated"); // Confirm all required variables are present

// ========== CONNECT TO DATABASE ==========
// MongoDB connection must be established before server starts
console.log("🔌 Connecting to MongoDB...");
connectDB().catch((err) => {
  // If database connection fails, stop the server immediately
  console.error("❌ Database connection failed:", err.message);
  process.exit(1); // Exit with error code 1
});

// ========== START HTTP SERVER ==========
// Get PORT from environment or use default 5000
const PORT = process.env.PORT || 5000;
// Get NODE_ENV from environment or default to development
const NODE_ENV = process.env.NODE_ENV || "development";

// Start Express server and listen on specified PORT
const server = app.listen(PORT, () => {
  // Print fancy startup banner
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

  // Initialize background job queues (Email, Image Processing, Search Indexing, Cleanup)
  initializeQueues();
});

// ========== REQUEST TIMEOUT CONFIGURATION ==========
// These prevent requests from hanging indefinitely
server.requestTimeout = 30000; // 30 seconds - max time for request (body) to be received
server.headersTimeout = 35000; // 35 seconds - max time for response headers to be sent

// ========== GRACEFUL SHUTDOWN HANDLER ==========
// Ensures proper cleanup when server receives termination signals (SIGINT, SIGTERM)
const gracefulShutdown = (signal) => {
  // Log which signal triggered shutdown (SIGTERM from Docker/PM2, SIGINT from Ctrl+C)
  console.log(`\n\n📛 ${signal} received. Shutting down gracefully...`);

  // Stop accepting new requests
  server.close(async () => {
    // Confirm HTTP server has stopped accepting connections
    console.log("✅ HTTP server closed");

    try {
      // Close database connection properly to flush pending operations
      await disconnectDB();
      // Exit cleanly with success code
      process.exit(0);
    } catch (err) {
      // If database disconnect fails, still exit but with error code
      console.error("Error during shutdown:", err);
      process.exit(1); // Exit with error code 1
    }
  });

  // Force kill if graceful shutdown takes too long (10 second timeout)
  setTimeout(() => {
    // If we reach here, graceful shutdown didn't complete in time
    console.error(
      "❌ Could not close connections in time, forcefully shutting down",
    );
    process.exit(1); // Force exit with error code
  }, 10000); // 10 second timeout
};

// ========== SIGNAL HANDLERS - RESPOND TO SHUTDOWN SIGNALS ==========
// SIGINT: Sent when user presses Ctrl+C in terminal
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// SIGTERM: Sent by Docker, Kubernetes, PM2, load balancers when stopping container
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ========== UNHANDLED PROMISE REJECTIONS ==========
// Catches promises that reject but aren't caught with .catch() or try/catch
process.on("unhandledRejection", (reason, promise) => {
  // Log the error for debugging
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit - allow server to continue serving requests
  // (Usually indicates a minor error that shouldn't crash the whole server)
});

// ========== UNCAUGHT EXCEPTIONS ==========
// Catches synchronous code errors that aren't caught by any try/catch
process.on("uncaughtException", (error) => {
  // Log the fatal error
  console.error("❌ Uncaught Exception:", error);
  // Must exit on uncaught exceptions - server state is undefined after this
  process.exit(1);
});

// ========== PROCESS WARNINGS ==========
// Node.js warnings (deprecations, memory leaks, etc.)
process.on("warning", (warning) => {
  // Log the warning with name and message
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
