/**
 * Job Queue Configuration
 *
 * Sets up Bull queues for background job processing:
 * - Email Queue: Welcome emails, notifications, comments
 * - Image Queue: Image optimization, compression, CDN upload
 * - Search Queue: Update search indexes, rebuild indexes
 * - Cleanup Queue: Delete files, cleanup orphaned data
 *
 * Redis Connection:
 * - Requires Redis server running on localhost:6379
 * - Or configure REDIS_URL in .env
 *
 * Usage:
 * const { emailQueue, imageQueue, searchQueue, cleanupQueue } = require('./jobs/queueConfig');
 * await emailQueue.add({ email, subject }, options);
 */

const Queue = require("bull");

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  // db: process.env.REDIS_DB || 0,
  // password: process.env.REDIS_PASSWORD,
};

console.log(`🔴 Redis Config: ${redisConfig.host}:${redisConfig.port}`);

/**
 * EMAIL QUEUE
 * Handles: Welcome emails, notifications, comments, password reset
 * Retry: 5 attempts with exponential backoff
 * Timeout: 30 seconds per job
 */
const emailQueue = new Queue("emails", redisConfig);

/**
 * IMAGE QUEUE
 * Handles: Image optimization, compression, resizing, CDN upload
 * Retry: 3 attempts (images are less critical)
 * Timeout: 60 seconds for heavy processing
 */
const imageQueue = new Queue("images", redisConfig);

/**
 * SEARCH QUEUE
 * Handles: Update search indexes, rebuild Elasticsearch, reindex
 * Retry: 2 attempts
 * Timeout: 120 seconds
 */
const searchQueue = new Queue("search", redisConfig);

/**
 * CLEANUP QUEUE
 * Handles: Delete files, cleanup orphaned data, delete user uploads
 * Retry: 1 attempt
 * Timeout: 30 seconds
 */
const cleanupQueue = new Queue("cleanup", redisConfig);

/**
 * LEFTOVER QUEUE (Feature #2)
 * Handles: 12-hour leftover notifications, recipe suggestions
 * Retry: 3 attempts (notifications are important)
 * Timeout: 45 seconds
 * Trigger: After user completes recipe + adds leftover
 */
const leftoverQueue = new Queue("leftovers", redisConfig);

// ========== QUEUE EVENT LISTENERS ==========

/**
 * When a job is started
 */
emailQueue.on("active", (job) => {
  console.log(`📧 Email job ${job.id} started`);
});

imageQueue.on("active", (job) => {
  console.log(`🖼️ Image job ${job.id} started`);
});

searchQueue.on("active", (job) => {
  console.log(`🔍 Search job ${job.id} started`);
});

cleanupQueue.on("active", (job) => {
  console.log(`🧹 Cleanup job ${job.id} started`);
});

leftoverQueue.on("active", (job) => {
  console.log(`📦 Leftover job ${job.id} started`);
});

/**
 * When a job completes successfully
 */
emailQueue.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

imageQueue.on("completed", (job) => {
  console.log(`✅ Image job ${job.id} completed`);
});

searchQueue.on("completed", (job) => {
  console.log(`✅ Search job ${job.id} completed`);
});

cleanupQueue.on("completed", (job) => {
  console.log(`✅ Cleanup job ${job.id} completed`);
});

leftoverQueue.on("completed", (job) => {
  console.log(`✅ Leftover job ${job.id} completed`);
});

/**
 * When a job fails
 */
emailQueue.on("failed", (job, err) => {
  console.error(`❌ Email job ${job.id} failed:`, err.message);
});

imageQueue.on("failed", (job, err) => {
  console.error(`❌ Image job ${job.id} failed:`, err.message);
});

searchQueue.on("failed", (job, err) => {
  console.error(`❌ Search job ${job.id} failed:`, err.message);
});

cleanupQueue.on("failed", (job, err) => {
  console.error(`❌ Cleanup job ${job.id} failed:`, err.message);
});

leftoverQueue.on("failed", (job, err) => {
  console.error(`❌ Leftover job ${job.id} failed:`, err.message);
});

/**
 * When job queue encounters an error
 * GRACEFUL DEGRADATION: Log as warning, don't crash
 * Redis is optional for core API functionality
 * Background jobs will retry when Redis becomes available
 */
const logError = (queueName, err) => {
  const isConnectionError =
    err.code === "ECONNREFUSED" || err.code === "ENOTFOUND";
  if (isConnectionError) {
    console.warn(
      `⚠️  ${queueName} Queue: Redis unavailable (${err.code}). ` +
        `Core API still works. Jobs will queue when Redis available.`,
    );
  } else {
    console.warn(`⚠️  ${queueName} Queue Error: ${err.message} (will retry)`);
  }
};

emailQueue.on("error", (err) => {
  logError("Email", err);
});

imageQueue.on("error", (err) => {
  logError("Image", err);
});

searchQueue.on("error", (err) => {
  logError("Search", err);
});

cleanupQueue.on("error", (err) => {
  logError("Cleanup", err);
});

leftoverQueue.on("error", (err) => {
  logError("Leftover", err);
});

module.exports = {
  emailQueue,
  imageQueue,
  searchQueue,
  cleanupQueue,
  leftoverQueue,
  redisConfig,
};
