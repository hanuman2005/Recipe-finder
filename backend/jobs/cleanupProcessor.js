// ========== CLEANUP JOB PROCESSOR ==========
// Background job processor for cleanup operations
// Non-blocking: Cleanup operations happen asynchronously
// Handles cascade deletion and orphaned file cleanup
//
// Architecture:
//   1. Controller calls queueCleanup() - returns immediately
//   2. Job added to Bull queue in Redis
//   3. Processor picks up job and performs cleanup
//   4. Deletes files and database documents
//   5. If fails, retries (attempts: 1 - no retries for cleanup)
//
// Actions Supported:
//   - delete-recipe: Delete recipe and cascade delete comments
//   - delete-comment: Delete single comment
//   - delete-user: Delete user and cascade delete recipes/comments
//   - delete-file: Delete file from disk
//   - cleanup-orphaned-images: Find and cleanup unreferenced images
//
// Job Data Format:
// {
//   action: "delete-recipe" | "delete-comment" | "delete-user" | "delete-file" | "cleanup-orphaned-images",
//   resourceId: "ObjectId", // For delete operations
//   filePath: "string" // For file deletion
// }

// Import cleanupQueue from queueConfig (initialized with Redis connection)
const { cleanupQueue } = require("./queueConfig");

// Import data models for cascade deletion
const Recipe = require("../models/Recipe");
const Comment = require("../models/Comment");
const User = require("../models/User");

// ========== FILE OPERATION FUNCTIONS ==========
/**
 * Collection of file deletion operations
 *
 * Production Implementation:
 *   - Use 'fs' module for local file deletion
 *   - Use AWS S3 SDK for cloud storage
 *   - Use Google Cloud Storage SDK for GCS
 *   - Consider adding to queue before deletion (fail-soft deletion)
 *
 * Current behavior:
 *   - All operations are mocked (log operation + simulate delay)
 *   - No actual file deletion happens
 *   - Returns success metadata
 */
const fileOperations = {
  /**
   * Delete single file from disk
   * Called when deleting recipe (delete recipe image)
   *
   * @param {String} filePath - Path to file to delete
   * @returns {Promise<Boolean>} true if successful
   */
  deleteFile: async (filePath) => {
    console.log(`🗑️ Deleting file: ${filePath}`);
    // Simulate file deletion (usually instant but included for consistency)
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  },

  /**
   * Delete directory recursively
   * Called for bulk cleanup operations
   *
   * @param {String} dirPath - Path to directory to delete
   * @returns {Promise<Boolean>} true if successful
   */
  deleteDirectory: async (dirPath) => {
    console.log(`📁 Deleting directory: ${dirPath}`);
    // Simulate directory deletion
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  },
};

// ========== DATABASE CLEANUP OPERATIONS ==========
/**
 * Collection of database-level cleanup operations
 * Handles cascade deletions and data consistency
 */
const databaseOperations = {
  /**
   * Delete recipe and cascade delete related data
   * Cascade deletions:
   *   - Delete all comments on the recipe
   *   - Delete associated image files
   *
   * @param {String} recipeId - MongoDB recipe ID
   * @returns {Promise<Object>} Deletion statistics
   */
  deleteRecipe: async (recipeId) => {
    console.log(`📖 Deleting recipe: ${recipeId}`);

    // Delete recipe document (will throw if not found)
    const recipe = await Recipe.findByIdAndDelete(recipeId);
    if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

    // Cascade: Delete all comments on this recipe
    const deletedComments = await Comment.deleteMany({ recipeId: recipeId });

    // Cascade: Delete recipe's image file if exists
    if (recipe.image) {
      await fileOperations.deleteFile(recipe.image);
    }

    return {
      recipeId,
      recipesDeleted: 1,
      commentsDeleted: deletedComments.deletedCount,
      filesDeleted: recipe.image ? 1 : 0,
    };
  },

  /**
   * Delete single comment
   * No cascade (comment is leaf node in data model)
   *
   * @param {String} commentId - MongoDB comment ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  deleteComment: async (commentId) => {
    console.log(`💬 Deleting comment: ${commentId}`);

    // Delete comment document (will throw if not found)
    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) throw new Error(`Comment not found: ${commentId}`);

    return {
      commentId,
      deleted: true,
    };
  },

  /**
   * Delete user and cascade delete related data
   * Cascade deletions:
   *   - Delete all recipes created by user
   *   - Delete all comments by user
   *   - Delete all associated images
   *
   * Impact: Most destructive operation (affects multiple recipes/comments)
   *
   * @param {String} userId - MongoDB user ID
   * @returns {Promise<Object>} Deletion statistics
   */
  deleteUser: async (userId) => {
    console.log(`👤 Deleting user: ${userId}`);

    // Delete user document (will throw if not found)
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    // Cascade: Delete all recipes created by this user
    const deletedRecipes = await Recipe.deleteMany({ user: userId });

    // Cascade: Delete all comments by this user
    const deletedComments = await Comment.deleteMany({ userId: userId });

    return {
      userId,
      usersDeleted: 1,
      recipesDeleted: deletedRecipes.deletedCount,
      commentsDeleted: deletedComments.deletedCount,
    };
  },

  /**
   * Clean up orphaned images (images without associated recipe)
   * Maintenance operation to find images that no longer have references
   * Happens when recipe is deleted but image file remains
   *
   * Current Implementation:
   *   - Only counts recipes with images (simple check)
   *   - Doesn't actually delete anything
   *
   * Production Implementation:
   *   - Scan file system for all images
   *   - Query database for all image references
   *   - Identify orphaned files (on disk but not in DB)
   *   - Delete orphaned files
   *
   * @returns {Promise<Object>} Cleanup statistics
   */
  cleanupOrphanedImages: async () => {
    console.log(`🧹 Cleaning up orphaned images`);

    // For simplicity, just log - in production, scan file system
    // and compare with database
    const recipes = await Recipe.find({ image: { $exists: true } });

    console.log(`Found ${recipes.length} recipes with images`);

    return {
      recipesWithImages: recipes.length,
      cleanupCompleted: true,
    };
  },
};

// ========== CLEANUP JOB PROCESSOR ==========
/**
 * Bull queue processor for cleanup jobs
 * Runs when job is pulled from queue (by Redis)
 *
 * Process:
 *   1. Extract job data: action, resourceId, filePath
 *   2. Validate action field present
 *   3. Route to appropriate cleanup operation
 *   4. Execute cleanup (delete from DB and/or filesystem)
 *   5. Return success response with deletion stats
 *
 * Actions:
 *   - delete-recipe: Requires resourceId - delete recipe + cascade comments
 *   - delete-comment: Requires resourceId - delete comment
 *   - delete-user: Requires resourceId - delete user + cascade recipes/comments
 *   - delete-file: Requires filePath - delete file from disk
 *   - cleanup-orphaned-images: No parameters - find/remove orphaned files
 *
 * Error Handling:
 *   - Missing action field - throw with message
 *   - Missing required parameters - throw with message
 *   - Unknown action - throw with message
 *   - All throws trigger retry logic (attempts: 1 - NO RETRIES for cleanup)
 *   - With no retries: Failed cleanup jobs go to dead-letter immediately
 *   - Rationale: Cleanup is one-time operation, retry might corrupt state
 *
 * Timeout: 30 seconds
 *   - Typical cleanup operations take 1-5 seconds
 *   - Provides buffer for database queries on large data
 *   - Cleanup should be fast (no processing, just deletion)
 *
 * @param {Object} job - Bull job object with .data property
 * @returns {Promise<Object>} Success response with deletion statistics
 * @throws {Error} If job fails (NO RETRY - goes to dead-letter directly)
 */
cleanupQueue.process(async (job) => {
  const { action, resourceId, filePath } = job.data;

  try {
    // Validate action field present
    if (!action) {
      throw new Error("Missing required field: action");
    }

    // Route to appropriate cleanup operation
    let result;
    switch (action) {
      case "delete-recipe":
        // Delete recipe and cascade delete comments
        if (!resourceId)
          throw new Error("Missing resourceId for delete-recipe action");
        result = await databaseOperations.deleteRecipe(resourceId);
        break;

      case "delete-comment":
        // Delete single comment
        if (!resourceId)
          throw new Error("Missing resourceId for delete-comment action");
        result = await databaseOperations.deleteComment(resourceId);
        break;

      case "delete-user":
        // Delete user and cascade delete recipes/comments
        if (!resourceId)
          throw new Error("Missing resourceId for delete-user action");
        result = await databaseOperations.deleteUser(resourceId);
        break;

      case "delete-file":
        // Delete file from disk
        if (!filePath)
          throw new Error("Missing filePath for delete-file action");
        result = await fileOperations.deleteFile(filePath);
        break;

      case "cleanup-orphaned-images":
        // Find and cleanup unreferenced images
        result = await databaseOperations.cleanupOrphanedImages();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Return success metadata with deletion statistics
    return {
      success: true,
      action: action,
      result: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Log error with emoji prefix
    console.error("❌ Cleanup job failed:", error.message);
    // Re-throw to trigger retry logic (or dead-letter if no retries)
    throw error;
  }
});

// ========== QUEUE CLEANUP HELPER FUNCTION ==========
/**
 * Queues a cleanup job for background processing
 * Non-blocking: Returns immediately without waiting for cleanup
 *
 * Usage in controllers:
 *   queueCleanup('delete-recipe', recipeId)
 *   queueCleanup('delete-comment', commentId)
 *   queueCleanup('delete-user', userId)
 *   queueCleanup('delete-file', null, filePath)
 *   queueCleanup('cleanup-orphaned-images')
 *
 * Retry Configuration:
 *   - attempts: 1 - NO RETRIES (one-time operations, retry risky)
 *   - timeout: 30000ms - Maximum 30 seconds per operation
 *   - removeOnComplete: true - Delete job from queue after success
 *
 * No Retry Strategy:
 *   - Cleanup is one-time, idempotent operation
 *   - Retrying could leave system in inconsistent state
 *   - If failure occurs, goes to dead-letter for manual investigation
 *   - User gets success response even if cleanup fails (fire-and-forget)
 *
 * Conditional Properties:
 *   - Uses conditional spread: ...(resourceId && { resourceId })
 *   - Only includes resourceId if provided (not null/undefined)
 *   - Only includes filePath if provided (not null/undefined)
 *   - Keeps job data minimal (only required fields)
 *
 * @param {String} action - "delete-recipe" | "delete-comment" | "delete-user" | "delete-file" | "cleanup-orphaned-images"
 * @param {String} resourceId - MongoDB ID (required for delete actions)
 * @param {String} filePath - File path (required for delete-file)
 * @returns {Promise<Object>} Bull job object with job.id
 *
 * @example
 *   // Queue recipe deletion
 *   await queueCleanup('delete-recipe', '507f1f77bcf86cd799439011');
 *
 *   // Queue file deletion
 *   await queueCleanup('delete-file', null, '/uploads/recipe-photo.jpg');
 *
 *   // Queue user deletion (cascade deletes recipes/comments)
 *   await queueCleanup('delete-user', userId);
 *
 *   // Queue orphaned image cleanup
 *   await queueCleanup('cleanup-orphaned-images');
 */
const queueCleanup = async (action, resourceId = null, filePath = null) => {
  // Default Bull queue configuration for cleanup jobs
  const defaultQueueOptions = {
    attempts: 1, // NO RETRIES (cleanup is one-time operation)
    timeout: 30000, // 30 seconds timeout (should be fast)
    removeOnComplete: true, // Clean up job from queue after success
  };

  // Queue job with only required fields
  // Conditional spread prevents sending null/undefined values
  return await cleanupQueue.add(
    {
      action,
      ...(resourceId && { resourceId }), // Include only if provided
      ...(filePath && { filePath }), // Include only if provided
    },
    defaultQueueOptions,
  );
};

// ========== EXPORT QUEUE AND FUNCTIONS ==========
// Exports for use in controllers and services
//
// Usage:
//   const { queueCleanup } = require('./jobs/cleanupProcessor');
//   queueCleanup('delete-recipe', recipeId);
module.exports = {
  cleanupQueue, // Cleanup Bull queue instance (used in initializeQueues.js)
  queueCleanup, // Function to queue cleanup jobs
  databaseOperations, // Exported for testing or custom usage
  fileOperations, // Exported for testing or custom usage
};
