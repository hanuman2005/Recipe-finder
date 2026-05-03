// ========== REDIS CLIENT CONFIGURATION & SETUP ==========
// This file configures connection to Redis, an in-memory data store
// Used for caching and managing Bull job queues

// ========== IMPORT REDIS CLIENT ==========
// redis library provides Node.js client for Redis server communication
import { createClient } from "redis";
// createClient — factory function that creates a Redis client instance
// The client manages the TCP connection to Redis server

// ========== CREATE REDIS CLIENT INSTANCE ==========
// Initialize Redis client with connection options
const client = createClient({
  // Connection URL pointing to Redis server
  url: process.env.REDIS_URL,
  // Format examples:
  // Local development:  redis://localhost:6379
  // With password:      redis://default:password@host:6379
  // Redis Cloud:        redis://default:password@cloud-provider:port

  // ========== SOCKET/CONNECTION CONFIGURATION ==========
  socket: {
    // Reconnection strategy: automatic retry logic if connection drops
    reconnectStrategy: (
      retries, // Parameter: number of reconnection attempts made so far
    ) => {
      // If we've tried more than 10 times, give up (critical failure)
      if (retries > 10) {
        // Return an error to stop retry attempts
        return new Error("Redis connection failed after 10 retries");
      }

      // Exponential backoff strategy: increase wait time between retries
      // Each retry waits longer than the previous one
      // Math.min() caps the wait at 3 seconds (prevents waiting forever)
      return Math.min(retries * 100, 3000);

      // Wait time progression:
      // retry 1  → 100ms   (1 attempt × 100)
      // retry 2  → 200ms   (2 attempts × 100)
      // retry 5  → 500ms   (5 attempts × 100)
      // retry 10 → 3000ms  (capped at 3 seconds)
    },
  },
});

// ========== CONNECTION EVENT LISTENERS ==========
// These listeners monitor Redis connection state changes

// EVENT: Successfully connected to Redis server
client.on("connect", () => console.log("✅ Redis connected"));

// EVENT: Connection established and ready for commands
client.on("ready", () => console.log("✅ Redis ready"));

// EVENT: Connection error occurred
// Logs errors like network failures, auth failures, etc
client.on("error", (err) => console.error("❌ Redis error:", err));

// EVENT: Attempting to reconnect after disconnection
client.on("reconnecting", () => console.warn("🔄 Redis reconnecting..."));

// ========== ESTABLISH CONNECTION ==========
// client.connect() returns a promise that resolves when connection is ready
// Must be called before any Redis operations (get, set, push, etc)
// Using await ensures connection is established before continuing
await client.connect();

// ========== EXPORT REDIS CLIENT ==========
// Export the connected client for use in job queue files
export default client;
