// ========== CORE DEPENDENCIES ==========
const express = require("express"); // Framework for building REST APIs
const cors = require("cors"); // Middleware to handle Cross-Origin Resource Sharing requests
const compression = require("compression"); // Middleware to compress HTTP responses with gzip
const dotenv = require("dotenv"); // Load environment variables from .env file
const cookieParser = require("cookie-parser"); // Middleware to parse cookies from requests

// ========== ROUTE IMPORTS ==========
// Each route file handles a specific resource (recipes, users, auth, comments)
const recipeRoutes = require("./routes/RecipeRoutes"); // Recipe CRUD and filtering routes
const userRoutes = require("./routes/userRoutes"); // User profile and management routes
const authRoutes = require("./routes/authRoutes"); // Authentication routes (login, register, etc)
const commentRoutes = require("./routes/commentRoutes"); // Comment and rating routes
const proTipRoutes = require("./routes/proTipRoutes"); // Feature #4: Community-submitted pro tips
const ingredientRoutes = require("./routes/ingredientRoutes"); // Ingredient glossary + substitution data
const ingredientExplanationRoutes = require("./routes/ingredientExplanationRoutes"); // Feature #9: Ingredient education system
const substitutionRoutes = require("./routes/substitutionRoutes"); // Feature #1: AI Substitutions with Claude API
const leftoverRoutes = require("./routes/leftoverRoutes"); // Feature #2: Smart Leftovers with 12-hr notifications

// ========== MIDDLEWARE IMPORTS ==========
// Middleware functions that process requests before they reach route handlers
const errorMiddleware = require("./middleware/errorMiddleware"); // Centralized error handling
const { generalLimiter } = require("./middleware/rateLimitMiddleware"); // Rate limiting to prevent abuse
const { validateUserInput } = require("./middleware/validationMiddleware"); // Input validation middleware

// Load environment variables (.env file) into process.env
dotenv.config();

// Initialize Express application
const app = express();

// ========== GLOBAL MIDDLEWARE CONFIGURATION ==========

// COMPRESSION MIDDLEWARE - Reduces response payload size by up to 70%
// Gzip compression is automatically applied to responses larger than 1KB
app.use(
  compression({
    level: 6, // Compression level: 0 (no compression) to 9 (maximum). 6 is a good balance
    threshold: 1024, // Only compress responses larger than 1KB to avoid overhead for small responses
    filter: (req, res) => {
      // Skip compression if client sends x-no-compress header
      if (req.headers["x-no-compress"]) {
        return false; // Don't compress this response
      }
      // Use default compression filter for all other cases
      return compression.filter(req, res);
    },
  }),
);

// CORS MIDDLEWARE - Allows frontend from specific origin to make API requests
// CORS prevents unauthorized domains from accessing our API
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Only allow requests from frontend URL
  credentials: true, // Allow cookies and authorization headers in cross-origin requests
  optionsSuccessStatus: 200, // Return 200 for successful CORS preflight requests
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed request headers
};
app.use(cors(corsOptions)); // Apply CORS rules to all routes

// RATE LIMITING MIDDLEWARE - Prevents abuse by limiting requests per IP
// Example: Max 100 requests per 15 minutes per IP address
app.use(generalLimiter);

// COOKIE PARSER MIDDLEWARE - Parses cookies from incoming requests
// Converts cookie string to req.cookies object for easy access
app.use(cookieParser());

// JSON BODY PARSER - Parses JSON request bodies (application/json)
// Limit set to 50MB to allow large image uploads in base64 format
app.use(express.json({ limit: "50mb" }));

// URL-ENCODED BODY PARSER - Parses form data (application/x-www-form-urlencoded)
// Extended: true allows nested objects and arrays in form data
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ========== REQUEST LOGGING & TRACKING MIDDLEWARE ==========
// This middleware tracks every incoming request and logs performance metrics
app.use((req, res, next) => {
  // Generate unique request ID for tracking requests through logs
  // Format: timestamp-randomString (e.g., 1680000000000-a1b2c3d4e)
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId; // Attach to request object so all handlers can access it

  // Log incoming request with method, path, and client IP
  console.log(
    `[${req.id}] 📥 ${req.method.toUpperCase()} ${req.path} - IP: ${req.ip}`,
  );

  // Record start time for response duration calculation
  const startTime = Date.now();

  // Attach listener to log when response is sent
  res.on("finish", () => {
    // Calculate how long the request took (in milliseconds)
    const duration = Date.now() - startTime;
    // Get HTTP status code from response (e.g., 200, 404, 500)
    const status = res.statusCode;
    // Choose emoji based on HTTP status: ✅ (2xx), ❌ (4xx/5xx), ⚠️ (3xx)
    const statusEmoji =
      status >= 200 && status < 300 ? "✅" : status >= 400 ? "❌" : "⚠️";

    // Log outgoing response with status code and duration
    console.log(`[${req.id}] 📤 ${statusEmoji} ${status} - ${duration}ms`);
  });

  // Pass control to next middleware
  next();
});

// ========== ROUTE MOUNTING ==========
// Mount route handlers at specific URL prefixes
// Each route file handles requests to its specific resource type

// Mount recipe routes: /api/recipes/* (e.g., GET /api/recipes, POST /api/recipes/:id/favorite)
app.use("/api/recipes", recipeRoutes);

// Mount user routes: /api/users/* (e.g., GET /api/users/me, PUT /api/users/:id)
app.use("/api/users", userRoutes);

// Mount auth routes: /api/auth/* (e.g., POST /api/auth/login, POST /api/auth/register)
app.use("/api/auth", authRoutes);

// Mount comment routes: /api/comments/* (e.g., POST /api/comments, DELETE /api/comments/:id)
app.use("/api/comments", commentRoutes);

// Mount pro tip routes: /api/pro-tips/* (Feature #4: Street-Style Techniques)
// Endpoints: POST /api/recipes/:id/pro-tips, GET /api/recipes/:id/pro-tips
app.use("/", proTipRoutes);
app.use("/api", proTipRoutes);

// Mount ingredient routes: /api/ingredients/* (Ingredient glossary + substitutions)
// Endpoints: GET /api/ingredients/search, GET /api/ingredients/:name/substitutes, etc
app.use("/api/ingredients", ingredientRoutes);

// Mount substitution routes: /api/substitutions/* (Feature #1: AI Substitutions)
// Endpoints: GET /api/substitutions?ingredient=cream&recipe=pasta
app.use("/api/substitutions", substitutionRoutes);

// Mount leftover routes: /api/leftovers/* (Feature #2: Smart Leftovers)
// Endpoints: POST /api/leftovers, GET /api/leftovers, GET /api/leftovers/:id/suggestions
app.use("/api/leftovers", leftoverRoutes);

// Mount ingredient explanation routes: /api/recipes/:id/ingredients-explained (Feature #9: Ingredient Education)
// Endpoints: GET /api/recipes/:id/ingredients-explained, GET /api/ingredients/:id/why-used
app.use("/api", ingredientExplanationRoutes);

// ========== HEALTH CHECK ENDPOINTS ==========
// These endpoints help monitoring systems check if the API is running

// ROOT ENDPOINT - Basic health check
// Returns a simple "API is running" message
// Used by: Load balancers, health monitoring, initial connectivity tests
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🚀 Recipe-Finder API is running", // Friendly status message
    version: "1.0.0", // API version for client compatibility checks
    environment: process.env.NODE_ENV || "development", // Current environment (dev/production)
    timestamp: new Date().toISOString(), // ISO format timestamp for client sync
  });
});

// /HEALTH ENDPOINT - Detailed health check with system metrics
// Returns detailed information about API health and resource usage
// Used by: Kubernetes, Docker Swarm, monitoring services like DataDog
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy", // Overall health status
    uptime: process.uptime(), // How long the server has been running (seconds)
    timestamp: new Date().toISOString(), // Current server time
    memory: {
      // Memory usage information
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`, // Resident Set Size (total memory used)
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`, // Total heap allocated
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, // Currently used heap
    },
    mongodb: {
      // MongoDB connection status
      connected: process.env.MONGO_URI ? "✅ Connected" : "❌ Not configured", // Connection status
    },
  });
});

// /LIVE ENDPOINT - Minimal liveness probe
// Returns immediately without doing expensive checks
// Used by: Load balancers for rapid health checks, Kubernetes liveness probes
app.get("/live", (req, res) => {
  // Minimal response - just confirm the process is alive
  res.status(200).json({ status: "alive" });
});

// /DB-STATUS ENDPOINT - Database connection details
// Returns detailed MongoDB connection information for debugging
// Used by: DevOps teams, developers troubleshooting database issues
app.get("/db-status", (req, res) => {
  try {
    // Import the database connection status function
    const { getConnectionStatus } = require("./db/connection");
    // Get current database connection state
    const status = getConnectionStatus();

    // Return detailed database information
    res.status(200).json({
      database: status.state, // Connection state (connected, disconnected, etc)
      connected: status.isConnected, // Boolean: true if connected
      host: status.host, // MongoDB server hostname
      database: status.database, // Database name (e.g., "recipe-finder")
      collections: status.collections, // List of collections in database
      readyState: status.readyState, // Mongoose connection readyState (0-3)
      timestamp: new Date().toISOString(), // When this status was captured
    });
  } catch (error) {
    // If something goes wrong, return error status
    res.status(500).json({
      database: "error", // Error indicator
      message: error.message, // Error details
    });
  }
});

// ========== 404 - NOT FOUND HANDLER ==========
// Catches all requests that don't match any defined routes
// This handler must come BEFORE the error middleware
app.use((req, res) => {
  // Return 404 status with helpful error information
  res.status(404).json({
    message: "❌ Route not found", // User-friendly error message
    path: req.path, // The URL path that was requested
    method: req.method, // The HTTP method used (GET, POST, etc)
  });
});

// ========== CENTRALIZED ERROR HANDLING MIDDLEWARE (MUST BE LAST) ==========
// This middleware catches all errors from route handlers
// Express automatically passes errors thrown/passed with next(error) here
// IMPORTANT: Must be the last middleware registered - order matters!
app.use(errorMiddleware);

// ========== EXPORT EXPRESS APPLICATION ==========
// Export the configured Express app to be used in server.js
module.exports = app;
