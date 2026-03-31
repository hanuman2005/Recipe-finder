/**
 * Cleanup Job Processor
 * Handles deleting files, cleaning up orphaned data
 *
 * Job Data Format:
 * {
 *   action: "delete-recipe" | "delete-comment" | "delete-user" | "cleanup-orphaned-images",
 *   resourceId: "ObjectId",
 *   filePath: "string" (optional)
 * }
 */

const { cleanupQueue } = require("./queueConfig");
const Recipe = require("../models/Recipe");
const Comment = require("../models/Comment");
const User = require("../models/User");

/**
 * Mock File Deletion Functions
 * Replace with real file deletion: fs, AWS S3, etc.
 */
const fileOperations = {
  // Delete file from disk
  deleteFile: async (filePath) => {
    console.log(`🗑️ Deleting file: ${filePath}`);
    // Simulate file deletion
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  },

  // Delete directory
  deleteDirectory: async (dirPath) => {
    console.log(`📁 Deleting directory: ${dirPath}`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  },
};

/**
 * Database Cleanup Operations
 */
const databaseOperations = {
  // Delete recipe and associated data
  deleteRecipe: async (recipeId) => {
    console.log(`📖 Deleting recipe: ${recipeId}`);

    const recipe = await Recipe.findByIdAndDelete(recipeId);
    if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

    // Delete associated comments
    const deletedComments = await Comment.deleteMany({ recipeId: recipeId });

    // Delete image file if exists
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

  // Delete comment
  deleteComment: async (commentId) => {
    console.log(`💬 Deleting comment: ${commentId}`);

    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) throw new Error(`Comment not found: ${commentId}`);

    return {
      commentId,
      deleted: true,
    };
  },

  // Delete user and associated data
  deleteUser: async (userId) => {
    console.log(`👤 Deleting user: ${userId}`);

    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    // Delete user's recipes
    const deletedRecipes = await Recipe.deleteMany({ user: userId });

    // Delete user's comments
    const deletedComments = await Comment.deleteMany({ userId: userId });

    return {
      userId,
      usersDeleted: 1,
      recipesDeleted: deletedRecipes.deletedCount,
      commentsDeleted: deletedComments.deletedCount,
    };
  },

  // Clean up orphaned images (images without associated recipe)
  cleanupOrphanedImages: async () => {
    console.log(`🧹 Cleaning up orphaned images`);

    // For simplicity, just log - in production, scan your file system
    // and compare with database
    const recipes = await Recipe.find({ image: { $exists: true } });

    console.log(`Found ${recipes.length} recipes with images`);

    return {
      recipesWithImages: recipes.length,
      cleanupCompleted: true,
    };
  },
};

/**
 * Process Cleanup Jobs
 */
cleanupQueue.process(async (job) => {
  const { action, resourceId, filePath } = job.data;

  try {
    // Validate required fields
    if (!action) {
      throw new Error("Missing required field: action");
    }

    let result;
    switch (action) {
      case "delete-recipe":
        if (!resourceId)
          throw new Error("Missing resourceId for delete-recipe action");
        result = await databaseOperations.deleteRecipe(resourceId);
        break;

      case "delete-comment":
        if (!resourceId)
          throw new Error("Missing resourceId for delete-comment action");
        result = await databaseOperations.deleteComment(resourceId);
        break;

      case "delete-user":
        if (!resourceId)
          throw new Error("Missing resourceId for delete-user action");
        result = await databaseOperations.deleteUser(resourceId);
        break;

      case "delete-file":
        if (!filePath)
          throw new Error("Missing filePath for delete-file action");
        result = await fileOperations.deleteFile(filePath);
        break;

      case "cleanup-orphaned-images":
        result = await databaseOperations.cleanupOrphanedImages();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Return success
    return {
      success: true,
      action: action,
      result: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Cleanup job failed:", error.message);
    throw error;
  }
});

/**
 * Helper function to queue cleanup operations
 *
 * @param {string} action - Action type
 * @param {string} resourceId - Resource ID (for delete operations)
 * @param {string} filePath - File path (for file deletion)
 */
const queueCleanup = async (action, resourceId = null, filePath = null) => {
  const defaultQueueOptions = {
    attempts: 1,
    timeout: 30000, // 30 seconds timeout
    removeOnComplete: true,
  };

  return await cleanupQueue.add(
    {
      action,
      ...(resourceId && { resourceId }),
      ...(filePath && { filePath }),
    },
    defaultQueueOptions,
  );
};

module.exports = {
  cleanupQueue,
  queueCleanup,
  databaseOperations,
  fileOperations,
};
