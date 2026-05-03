/**
 * Queue Initialization
 * Starts all background job processors when server starts
 *
 * This file should be required in server.js after database connection
 */

/**
 * Initialize all background job processors
 * Must be called AFTER database connection is established
 */
const initializeQueues = () => {
  console.log("\n📋 Initializing Background Job Queues...\n");

  // Require processors (this starts processing jobs)
  require("./emailProcessor");
  console.log("✅ Email Queue Processor Initialized");

  require("./imageProcessor");
  console.log("✅ Image Processing Queue Processor Initialized");

  require("./searchIndexProcessor");
  console.log("✅ Search Index Queue Processor Initialized");

  require("./cleanupProcessor");
  console.log("✅ Cleanup Queue Processor Initialized");

  console.log("\n🚀 All Background Job Queues Ready!\n");
};

module.exports = { initializeQueues };
