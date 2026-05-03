const dotenv = require("dotenv");
const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const { initializeQueues } = require("./jobs/initializeQueues");

dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET", "PORT"];
const missing = required.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

connectDB().catch((err) => {
  console.error("❌ DB connection failed:", err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║  🚀 RECIPE-FINDER API              ║
╚════════════════════════════════════╝
📡 http://localhost:${PORT}
🌍 ${NODE_ENV}
⏰ ${new Date().toISOString()}
  `);
  initializeQueues();
});

server.requestTimeout = 30000;
server.headersTimeout = 35000;

const gracefulShutdown = (signal) => {
  console.log(`\n📛 ${signal} — shutting down...`);
  server.close(async () => {
    console.log("✅ HTTP server closed");
    try {
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error("Shutdown error:", err);
      process.exit(1);
    }
  });
  setTimeout(() => { console.error("❌ Forced exit"); process.exit(1); }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => console.error("❌ Unhandled rejection:", reason));
process.on("uncaughtException", (err) => { console.error("❌ Uncaught exception:", err); process.exit(1); });
process.on("warning", (w) => console.warn("⚠️ Warning:", w.name, w.message));

setInterval(() => {
  const m = process.memoryUsage();
  console.log(`[MONITOR] Heap: ${(m.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(m.heapTotal / 1024 / 1024).toFixed(1)}MB`);
}, 60000);

module.exports = server;
