const express = require("express");
const cors = require("cors");
const compression = require("compression");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const recipeRoutes = require("./routes/RecipeRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");
const proTipRoutes = require("./routes/proTipRoutes");
const ingredientRoutes = require("./routes/ingredientRoutes");
const ingredientExplanationRoutes = require("./routes/ingredientExplanationRoutes");
const substitutionRoutes = require("./routes/substitutionRoutes");
const leftoverRoutes = require("./routes/leftoverRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");
const { generalLimiter } = require("./middleware/rateLimitMiddleware");

dotenv.config();

const app = express();

app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compress"]) return false;
      return compression.filter(req, res);
    },
  }),
);

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(generalLimiter);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  console.log(`[${req.id}] 📥 ${req.method.toUpperCase()} ${req.path} - IP: ${req.ip}`);
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusEmoji = status >= 200 && status < 300 ? "✅" : status >= 400 ? "❌" : "⚠️";
    console.log(`[${req.id}] 📤 ${statusEmoji} ${status} - ${duration}ms`);
  });
  next();
});

app.use("/api/recipes", recipeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/recipes", proTipRoutes);   // /:recipeId/pro-tips, /:recipeId/ai-tips
app.use("/api/pro-tips", proTipRoutes); // /:tipId/helpful
app.use("/api", proTipRoutes);          // /my-pro-tips, /admin/pro-tips/...
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/substitutions", substitutionRoutes);
app.use("/api/leftovers", leftoverRoutes);
app.use("/api", ingredientExplanationRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "🚀 Recipe-Finder API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

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

app.get("/live", (req, res) => {
  res.status(200).json({ status: "alive" });
});

app.get("/db-status", (req, res) => {
  try {
    const { getConnectionStatus } = require("./config/db");
    const status = getConnectionStatus();
    res.status(200).json({
      database: status.state,
      connected: status.isConnected,
      host: status.host,
      dbName: status.database,
      collections: status.collections,
      readyState: status.readyState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ database: "error", message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({
    message: "❌ Route not found",
    path: req.path,
    method: req.method,
  });
});

app.use(errorMiddleware);

module.exports = app;
