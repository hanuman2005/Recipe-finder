/**
 * LEFTOVER PROCESSOR - Bull Queue Job Handler
 *
 * Purpose:
 * - Run every 12 hours (or on schedule) to check for leftovers
 * - Generate recipe suggestions for each leftover
 * - Send notifications to users
 * - Mark as notified to prevent duplicates
 *
 * This is the "smart brain" that makes Feature #2 work
 *
 * Flow:
 * 1. User completes recipe + adds leftover (at 2pm)
 * 2. Bull job scheduled for +12 hours (at 2am next day)
 * 3. Job runs: "Find all leftovers added 12+ hours ago"
 * 4. For each leftover: Generate recipe suggestions
 * 5. Send notification: "You have rice! Try Fried Rice, Lemon Rice..."
 * 6. Mark as notified
 * 7. Wait for next leftover or next 12 hours
 */

const leftoverService = require("../services/leftoverService");
const User = require("../models/User");
const AppError = require("../utils/AppError");

/**
 * PROCESS LEFTOVER NOTIFICATION
 *
 * Called by Bull Queue at scheduled time
 * Generates suggestions and prepares notification data
 *
 * @param {Object} job - Bull job object
 * @param {String} job.data.leftoverId - Leftover to process
 * @param {String} job.data.userId - User to notify
 * @returns {Object} Notification data
 */
const processLeftoverNotification = async (job) => {
  try {
    const { leftoverId, userId } = job.data;

    if (!leftoverId || !userId) {
      throw new AppError("Missing leftoverId or userId in job data", 400);
    }

    console.log(
      `[Leftover Job] Processing notification for leftover: ${leftoverId}`,
    );

    // Get leftover details
    const leftoverDetails =
      await leftoverService.getLeftoverDetails(leftoverId);

    if (!leftoverDetails) {
      console.warn(`[Leftover Job] Leftover ${leftoverId} not found`);
      return null;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`[Leftover Job] User ${userId} not found`);
      return null;
    }

    // Generate recipe suggestions
    const suggestions = await leftoverService.generateRecipeSuggestions(
      leftoverDetails.ingredientName,
      userId,
      5, // Top 5 recipes
    );

    // Prepare notification data
    const notificationData = {
      userId,
      type: "leftover_suggestion",
      title: `Your ${leftoverDetails.ingredientName} is waiting!`,
      message: `You have ${leftoverDetails.quantity} ${leftoverDetails.unit} of ${leftoverDetails.ingredientName} left. Try one of these recipes!`,
      leftoverId: leftoverId,
      leftoverDetails: {
        ingredientName: leftoverDetails.ingredientName,
        quantity: leftoverDetails.quantity,
        unit: leftoverDetails.unit,
        image: leftoverDetails.ingredient?.images?.primary,
        storageInstructions: leftoverDetails.storageInstructions,
        expiresAt: leftoverDetails.expiremissionDate,
      },
      suggestedRecipes: suggestions,
      actionUrl: `/leftovers/${leftoverId}`,
      priority: "high",
      createdAt: new Date(),
    };

    console.log(
      `[Leftover Job] ✅ Generated notification for ${leftoverDetails.ingredientName}`,
    );

    // Mark as notified
    await leftoverService.markNotificationSent(leftoverId);

    // TODO: Send actual notification (email, push, in-app)
    // await sendNotificationService.send(notificationData);

    return notificationData;
  } catch (error) {
    console.error(
      `[Leftover Job] ❌ Error processing notification:`,
      error.message,
    );
    throw error; // Bull will retry
  }
};

/**
 * SCHEDULE LEFTOVER JOB
 *
 * Called when user adds a leftover
 * Schedules notification for 12 hours later
 *
 * Usage (in controller):
 * await scheduleLeftoverNotification(leftoverId, userId);
 *
 * @param {String} leftoverId - Leftover document ID
 * @param {String} userId - User ID
 * @param {Number} delayMs - Delay in milliseconds (default: 12 hours)
 */
const scheduleLeftoverNotification = async (
  leftoverId,
  userId,
  delayMs = 12 * 60 * 60 * 1000,
) => {
  try {
    // Import here to avoid circular dependency
    const { leftoverQueue } = require("./queueConfig");

    if (!leftoverQueue) {
      throw new AppError("Leftover queue not initialized", 500);
    }

    // Add job to Bull Queue
    const job = await leftoverQueue.add(
      {
        leftoverId,
        userId,
      },
      {
        delay: delayMs,
        attempts: 3, // Retry 3 times
        backoff: {
          type: "exponential",
          delay: 2000, // Start with 2 second backoff
        },
        removeOnComplete: true, // Delete job after success
        removeOnFail: false, // Keep failed jobs for debugging
      },
    );

    console.log(
      `[Leftover Job] 📅 Scheduled notification job: ${job.id} for leftover ${leftoverId}`,
    );
    return job;
  } catch (error) {
    console.error(`[Leftover Job] ❌ Error scheduling job:`, error.message);
    throw error;
  }
};

/**
 * BATCH PROCESS LEFTOVERS (Manual Trigger)
 *
 * Run this to immediately process all unnotified leftovers
 * Useful for testing or manual triggers
 *
 * Usage (in admin endpoint):
 * await batchProcessLeftovers();
 *
 * Returns: Summary of processed leftovers
 */
const batchProcessLeftovers = async () => {
  try {
    console.log(`[Leftover Job] 🚀 Starting batch processing of leftovers...`);

    // Find all users with unnotified leftovers
    const users = await User.find({});
    let totalProcessed = 0;
    let totalFailed = 0;

    for (const user of users) {
      try {
        const unnotified = await leftoverService.findUnnotifiedLeftovers(
          user._id,
        );

        for (const leftover of unnotified) {
          try {
            await processLeftoverNotification({
              data: {
                leftoverId: leftover._id,
                userId: user._id,
              },
            });
            totalProcessed++;
          } catch (err) {
            console.error(
              `[Leftover Job] Failed to process leftover ${leftover._id}:`,
              err.message,
            );
            totalFailed++;
          }
        }
      } catch (err) {
        console.error(
          `[Leftover Job] Error processing user ${user._id}:`,
          err.message,
        );
      }
    }

    const summary = {
      totalProcessed,
      totalFailed,
      message: `Batch processing complete. Processed: ${totalProcessed}, Failed: ${totalFailed}`,
    };

    console.log(`[Leftover Job] ✅ Batch complete:`, summary);
    return summary;
  } catch (error) {
    console.error(`[Leftover Job] ❌ Batch processing error:`, error.message);
    throw error;
  }
};

/**
 * HANDLE JOB FAILURE
 *
 * Called when Bull job fails after all retries
 * Useful for logging and debugging
 */
const handleJobFailure = (error) => {
  console.error(
    `[Leftover Job] 💥 Job failed after all retries:`,
    error.message,
  );
  // TODO: Send alert to admins
};

/**
 * HANDLE JOB COMPLETION
 *
 * Called when Bull job succeeds
 */
const handleJobCompletion = (job, result) => {
  console.log(`[Leftover Job] ✅ Job ${job.id} completed:`, result);
  // Optional: Log analytics
};

// ========== EXPORT PROCESSOR FUNCTIONS ==========
module.exports = {
  processLeftoverNotification,
  scheduleLeftoverNotification,
  batchProcessLeftovers,
  handleJobFailure,
  handleJobCompletion,
};
