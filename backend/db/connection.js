const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// ========== CONNECTION OPTIONS ==========
const connectionOptions = {
  // Modern MongoDB driver options (no deprecation warnings)
  useNewUrlParser: true,
  useUnifiedTopology: true,

  // ========== CONNECTION POOLING ==========
  // How many connections to maintain in pool
  maxPoolSize: 10, // 10 connections for concurrent queries
  minPoolSize: 2, // Keep at least 2 warm

  // ========== TIMEOUTS ==========
  // How long to wait for server selection
  serverSelectionTimeoutMS: 5000, // 5 seconds

  // How long to wait for a socket to respond
  socketTimeoutMS: 45000, // 45 seconds

  // ========== RETRIES ==========
  // Automatically retry failed connections
  retryWrites: true,
  retryReads: true,

  // ========== AUTH ==========
  // Credentials passed in connection string, not here

  // ========== CONNECTION EVENTS ==========
  // Don't wait for initial connection before returning
  waitQueueTimeoutMS: 10000,
};

// ========== CONNECTION STATE ==========
let isConnected = false;

// ========== CONNECT FUNCTION ==========
const connectDB = async () => {
  // Prevent multiple connections if already connected
  if (isConnected) {
    console.log("📦 Using existing database connection");
    return mongoose.connection;
  }

  try {
    // ========== VALIDATE CONNECTION STRING ==========
    if (!process.env.MONGO_URI) {
      throw new Error(
        "❌ MONGO_URI not defined in .env file. " +
          "Add: MONGO_URI=mongodb+srv://user:pass@host/database",
      );
    }

    console.log("🔌 Connecting to MongoDB...");
    console.log(`   URI: ${process.env.MONGO_URI.substring(0, 50)}...`);

    // ========== ESTABLISH CONNECTION ==========
    const conn = await mongoose.connect(
      process.env.MONGO_URI,
      connectionOptions,
    );

    isConnected = true;

    // ========== LOG CONNECTION DETAILS ==========
    console.log(`
✅ MongoDB Connected Successfully!
   Host: ${conn.connection.host}
   Port: ${conn.connection.port}
   Database: ${conn.connection.name}
   State: ${getConnectionState(conn.connection.readyState)}
    `);

    // ========== SETUP CONNECTION EVENT HANDLERS ==========
    setupConnectionEventHandlers();

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed!`);
    console.error(`   Error: ${error.message}`);

    // ========== PROVIDE DEBUGGING HELP ==========
    if (error.message.includes("authentication failed")) {
      console.error("   💡 Hint: Check username/password in MONGO_URI");
    }
    if (error.message.includes("ENOTFOUND")) {
      console.error("   💡 Hint: Check MongoDB host URL is accessible");
    }
    if (error.message.includes("ECONNREFUSED")) {
      console.error("   💡 Hint: MongoDB server might be offline");
    }

    // Exit process - app won't work without DB
    process.exit(1);
  }
};

// ========== CONNECTION STATE HELPER ==========
const getConnectionState = (readyState) => {
  const states = {
    0: "❌ Disconnected",
    1: "✅ Connected",
    2: "🔄 Connecting",
    3: "🔄 Disconnecting",
  };
  return states[readyState] || "❓ Unknown";
};

// ========== CONNECTION EVENT HANDLERS ==========
const setupConnectionEventHandlers = () => {
  const db = mongoose.connection;

  // When connection is established
  db.on("connected", () => {
    console.log("✅ Mongoose connected to MongoDB");
  });

  // When connection is disconnected
  db.on("disconnected", () => {
    console.warn("⚠️  Mongoose disconnected from MongoDB");
    isConnected = false;
  });

  // When error occurs
  db.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

  // When reconnecting
  db.on("reconnected", () => {
    console.log("🔄 Mongoose reconnected to MongoDB");
    isConnected = true;
  });

  // Monitor connection pool
  db.on("open", () => {
    console.log("📊 Connection pool is open and ready");
  });
};

// ========== DISCONNECT FUNCTION (for graceful shutdown) ==========
const disconnectDB = async () => {
  try {
    if (isConnected) {
      await mongoose.connection.close();
      isConnected = false;
      console.log("✅ MongoDB disconnected");
    }
  } catch (error) {
    console.error("❌ Error disconnecting MongoDB:", error.message);
    throw error;
  }
};

// ========== GET CONNECTION STATUS ==========
const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    state: getConnectionState(mongoose.connection.readyState),
    host: mongoose.connection.host,
    database: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections).length,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  connectionOptions,
};
