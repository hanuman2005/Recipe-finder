const express = require("express");
const cors = require("cors");
const compression = require("compression");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Import routes
const recipeRoutes = require("./routes/RecipeRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");

// Import middleware
const errorMiddleware = require("./middleware/errorMiddleware");
const { generalLimiter } = require("./middleware/rateLimitMiddleware");
const { validateUserInput } = require("./middleware/validationMiddleware");

dotenv.config();

const app = express();

// ========== GLOBAL MIDDLEWARE ==========
// Compression - Gzip responses (reduces payload by 70%)
app.use(
  compression({
    level: 6, // Balance between compression speed and ratio
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compress"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

// CORS - Allow cross-origin requests from specific origins only
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Rate limiting - Apply to all requests
app.use(generalLimiter);

// Parse cookies
app.use(cookieParser());

// Body parser - Parse JSON request bodies
app.use(express.json({ limit: "50mb" }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ========== REQUEST LOGGING MIDDLEWARE ==========
// Track all incoming requests
app.use((req, res, next) => {
  // Generate unique request ID
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;

  // Log request
  console.log(
    `[${req.id}] 📥 ${req.method.toUpperCase()} ${req.path} - IP: ${req.ip}`,
  );

  // Track response time
  const startTime = Date.now();

  // Log response when sent
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusEmoji =
      status >= 200 && status < 300 ? "✅" : status >= 400 ? "❌" : "⚠️";

    console.log(`[${req.id}] 📤 ${statusEmoji} ${status} - ${duration}ms`);
  });

  next();
});

// ========== ROUTES ==========
app.use("/api/recipes", recipeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/comments", commentRoutes);

// ========== HEALTH CHECK ENDPOINTS ==========
// Basic health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🚀 Recipe-Finder API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check (for monitoring systems)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
    mongodb: {
      connected: process.env.MONGO_URI ? "✅ Connected" : "❌ Not configured",
    },
  });
});

// Live check (for load balancers)
app.get("/live", (req, res) => {
  res.status(200).json({ status: "alive" });
});

// Database connection status
app.get("/db-status", (req, res) => {
  try {
    const { getConnectionStatus } = require("./db/connection");
    const status = getConnectionStatus();

    res.status(200).json({
      database: status.state,
      connected: status.isConnected,
      host: status.host,
      database: status.database,
      collections: status.collections,
      readyState: status.readyState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      database: "error",
      message: error.message,
    });
  }
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({
    message: "❌ Route not found",
    path: req.path,
    method: req.method,
  });
});

// ========== ERROR HANDLING MIDDLEWARE (MUST BE LAST) ==========
app.use(errorMiddleware);

module.exports = app;
