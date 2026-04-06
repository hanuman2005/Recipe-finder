// ========== CORE DEPENDENCIES ==========
const mongoose = require("mongoose"); // MongoDB ODM (Object Data Modeling library)
const dotenv = require("dotenv"); // Load environment variables

// Load environment variables from .env file into process.env
dotenv.config();

// ========== DATABASE CONNECTION CONFIGURATION ==========
// These options optimize the MongoDB connection for production use
const connectionOptions = {
  // ========== PARSER & TOPOLOGY SETTINGS (MongoDB Driver v3+) ==========
  useNewUrlParser: true, // Use new MongoDB connection string parser (required for v3+)
  useUnifiedTopology: true, // Use unified topology engine for connection management

  // ========== CONNECTION POOLING ==========
  // Connection pool: keeps multiple connections to reuse for concurrent requests
  // Reduces overhead of creating new connection each time
  maxPoolSize: 10, // Maximum connections in pool. 10 allows up to 10 concurrent queries
  minPoolSize: 2, // Minimum connections to keep in pool. 2 keeps warm connections ready

  // ========== TIMEOUT CONFIGURATIONS ==========
  // Server selection timeout: how long driver waits to find a server that matches criteria
  serverSelectionTimeoutMS: 5000, // 5 seconds - fail fast if MongoDB not reachable

  // Socket timeout: how long to wait for response from MongoDB after sending request
  socketTimeoutMS: 45000, // 45 seconds - allows time for slow queries on large datasets

  // ========== AUTOMATIC RETRY SETTINGS ==========
  // Mongoose automatically retries failed operations
  retryWrites: true, // Retry write operations if connection temporarily fails
  retryReads: true, // Retry read operations if connection temporarily fails

  // ========== AUTHENTICATION ==========
  // Database credentials are passed in MONGO_URI connection string, not in options
  // Format: mongodb+srv://username:password@host/database?auth=source

  // ========== QUEUE TIMEOUT ==========
  // How long write requests wait in queue if connection pool is exhausted
  waitQueueTimeoutMS: 10000, // 10 seconds - fail if can't get connection within this time
};

// ========== CONNECTION STATE TRACKING ==========
// Global variable to track if we have an active MongoDB connection
// Prevents multiple simultaneous connection attempts
let isConnected = false;

// ========== PRIMARY DATABASE CONNECTION FUNCTION ==========
// Creates MongoDB connection if not already connected
// Called from server.js during startup
const connectDB = async () => {
  // ========== PREVENT DUPLICATE CONNECTIONS ==========
  // If already connected, reuse existing connection (connection pooling)
  if (isConnected) {
    // Log that we're reusing existing connection
    console.log("📦 Using existing database connection");
    // Return mongoose connection object
    return mongoose.connection;
  }

  try {
    // ========== VALIDATE MONGO_URI ENVIRONMENT VARIABLE ==========
    // Check if MONGO_URI is set in .env file
    if (!process.env.MONGO_URI) {
      // Throw error with helpful message
      throw new Error(
        "❌ MONGO_URI not defined in .env file. " +
          "Add: MONGO_URI=mongodb+srv://user:pass@host/database",
      );
    }

    // Log connection attempt (masked for security - only show first 50 chars)
    console.log("🔌 Connecting to MongoDB...");
    console.log(`   URI: ${process.env.MONGO_URI.substring(0, 50)}...`);

    // ========== ESTABLISH CONNECTION TO MONGODB ==========
    // mongoose.connect returns a promise that resolves when connected
    const conn = await mongoose.connect(
      process.env.MONGO_URI, // Connection string from .env
      connectionOptions, // Configuration options defined above
    );

    // Mark as connected for future reference
    isConnected = true;

    // ========== LOG SUCCESSFUL CONNECTION DETAILS ==========
    // Display connection information for debugging
    console.log(`
✅ MongoDB Connected Successfully!
   Host: ${conn.connection.host}
   Port: ${conn.connection.port}
   Database: ${conn.connection.name}
   State: ${getConnectionState(conn.connection.readyState)}
    `);

    // ========== SETUP CONNECTION EVENT HANDLERS ==========
    // Monitor connection state changes (disconnect, error, reconnect, etc)
    setupConnectionEventHandlers();

    // Return connection object
    return conn;

    // ========== ERROR HANDLING ==========
  } catch (error) {
    // Log connection failure
    console.error(`❌ MongoDB Connection Failed!`);
    console.error(`   Error: ${error.message}`);

    // ========== PROVIDE HELPFUL DEBUGGING HINTS ==========
    // Check for common errors and suggest fixes

    // Authentication error: wrong username/password
    if (error.message.includes("authentication failed")) {
      console.error("   💡 Hint: Check username/password in MONGO_URI");
    }

    // DNS resolution error: host not found
    if (error.message.includes("ENOTFOUND")) {
      console.error("   💡 Hint: Check MongoDB host URL is accessible");
    }

    // Connection refused: MongoDB server offline
    if (error.message.includes("ECONNREFUSED")) {
      console.error("   💡 Hint: MongoDB server might be offline");
    }

    // Exit process since app cannot function without database
    process.exit(1);
  }
};

// ========== CONNECTION STATE HELPER FUNCTION ==========
// Converts mongoose connection readyState number to human-readable string
// Used for logging and monitoring
const getConnectionState = (readyState) => {
  // Map readyState numbers to descriptive strings with emojis
  const states = {
    0: "❌ Disconnected", // Connection closed - no connection to MongoDB
    1: "✅ Connected", // Connection is open and ready for operations
    2: "🔄 Connecting", // Connection attempt in progress
    3: "🔄 Disconnecting", // Disconnection in progress
  };
  // Return the state string for this readyState number, or unknown if not recognized
  return states[readyState] || "❓ Unknown";
};

// ========== CONNECTION EVENT HANDLERS SETUP ==========
// Attaches listeners to mongoose connection events
// Catches state changes: connect, disconnect, error, reconnect, etc
const setupConnectionEventHandlers = () => {
  // Get reference to mongodb connection object
  const db = mongoose.connection;

  // EVENT: Connection successfully established
  // Fired when mongoose connects to MongoDB
  db.on("connected", () => {
    console.log("✅ Mongoose connected to MongoDB");
  });

  // EVENT: Connection lost or closed
  // Fired when connection drops or is intentionally closed
  db.on("disconnected", () => {
    console.warn("⚠️  Mongoose disconnected from MongoDB");
    isConnected = false; // Update our tracking variable
  });

  // EVENT: Connection error occurred
  // Fired when error occurs on connection (network, credentials, etc)
  db.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

  // EVENT: Automatic reconnection successful
  // Fired when mongoose automatically reconnects after disconnection
  db.on("reconnected", () => {
    console.log("🔄 Mongoose reconnected to MongoDB");
    isConnected = true; // Update our tracking variable
  });

  // EVENT: Connection pool opened and ready
  // Fired when connection is fully established and ready for queries
  db.on("open", () => {
    console.log("📊 Connection pool is open and ready");
  });
};

// ========== GRACEFUL SHUTDOWN - DISCONNECT FUNCTION ==========
// Properly closes MongoDB connection
// Called from server.js during graceful shutdown
const disconnectDB = async () => {
  try {
    // Only disconnect if we're currently connected
    if (isConnected) {
      // Close mongoose connection and all pooled connections
      await mongoose.connection.close();
      // Update connection status
      isConnected = false;
      // Confirm disconnection
      console.log("✅ MongoDB disconnected");
    }
  } catch (error) {
    // Log error if disconnection fails
    console.error("❌ Error disconnecting MongoDB:", error.message);
    // Re-throw error so caller knows disconnection failed
    throw error;
  }
};

// ========== GET CONNECTION STATUS INFORMATION ==========
// Returns detailed information about current MongoDB connection
// Used by health check endpoints (/db-status)
const getConnectionStatus = () => {
  return {
    isConnected, // Boolean: true if connected
    readyState: mongoose.connection.readyState, // Numeric state (0-3)
    state: getConnectionState(mongoose.connection.readyState), // Human-readable state
    host: mongoose.connection.host, // MongoDB server hostname
    database: mongoose.connection.name, // Database name
    collections: Object.keys(mongoose.connection.collections).length, // Number of loaded models
  };
};

// ========== MODULE EXPORTS ==========
// Export functions for use in server.js and other files
module.exports = {
  connectDB, // Function to initialize connection
  disconnectDB, // Function to close connection
  getConnectionStatus, // Function to get connection details
  connectionOptions, // Connection configuration (exported for reference)
};
