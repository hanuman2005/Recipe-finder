// ========== SEARCH INDEX UPDATE PROCESSOR ==========
// Background job processor for managing search index operations
// Non-blocking: Search index updates happen asynchronously
// Decouples search index updates from HTTP response
//
// Search engines enable fast full-text search across recipe attributes
// This processor maintains syncing between MongoDB and search index
//
// Architecture:
//   1. Controller calls queueSearchIndexUpdate() - returns immediately
//   2. Job added to Bull queue in Redis
//   3. Processor picks up job and updates search index
//   4. Updates recipe search documents or rebuilds indexes
//   5. If fails, retries with exponential backoff
//
// Actions Supported:
//   - add: Add new recipe to search index
//   - update: Update indexed recipe
//   - delete: Remove recipe from index
//   - rebuild-category: Rebuild all recipes in category
//   - rebuild-all: Rebuild entire search index
//
// Job Data Format:
// {
//   action: "add" | "update" | "delete" | "rebuild-category" | "rebuild-all",
//   recipeId: "ObjectId", // Required for add/update/delete
//   category: "string" // Required for rebuild-category
// }

// Import searchQueue from queueConfig (initialized with Redis connection)
const { searchQueue } = require("./queueConfig");

// Import Recipe model to fetch data for indexing
const Recipe = require("../models/Recipe");

// ========== MOCK SEARCH INDEX OPERATIONS ==========
/**
 * Collection of mock search index operations
 *
 * Production Implementation:
 *   - Use Elasticsearch for advanced search (most popular)
 *   - Use Algolia for hosted search-as-service
 *   - Use Meilisearch for open-source alternative
 *   - Use Typesense for typo-tolerant search
 *   - MongoDB full-text search ($text operator) for simple cases
 *
 * Current behavior:
 *   - All operations are mocked (log operation + simulate delay)
 *   - No actual search engine interaction
 *   - Returns metadata about what would have been indexed
 */
const searchIndexOperations = {
  /**
   * Add recipe to search index
   * Called when recipe first created
   * Creates searchable document with title, category, description, etc.
   *
   * @param {String} recipeId - MongoDB recipe ID
   * @returns {Promise<Object>} Indexed recipe metadata
   */
  addToIndex: async (recipeId) => {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

    console.log(`🔍 Adding recipe ${recipeId} to search index`);
    // Simulate index operation (usually 500ms-2s in production)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      recipeId,
      title: recipe.title,
      category: recipe.category,
      indexed: true,
    };
  },

  /**
   * Update recipe in search index
   * Called when recipe is modified (title, category, etc)
   * Updates searchable document with new values
   * Typically faster than re-indexing everything
   *
   * @param {String} recipeId - MongoDB recipe ID
   * @returns {Promise<Object>} Updated recipe metadata
   */
  updateIndex: async (recipeId) => {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

    console.log(`🔄 Updating recipe ${recipeId} in search index`);
    // Simulate index operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      recipeId,
      title: recipe.title,
      category: recipe.category,
      updated: true,
    };
  },

  /**
   * Remove recipe from search index
   * Called when recipe deleted
   * Removes searchable document so it won't appear in search results
   *
   * @param {String} recipeId - MongoDB recipe ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  removeFromIndex: async (recipeId) => {
    console.log(`🗑️ Removing recipe ${recipeId} from search index`);
    // Simulate deletion operation (usually faster than additions)
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      recipeId,
      removed: true,
    };
  },

  /**
   * Rebuild search index for entire category
   * Called during maintenance or category restructuring
   * Re-indexes all recipes in specific category
   * Useful when search config changes (analyzers, tokenizers, etc)
   *
   * @param {String} category - Recipe category name
   * @returns {Promise<Object>} Rebuild statistics
   */
  rebuildCategoryIndex: async (category) => {
    // Fetch all recipes in category (minimal fields for speed)
    const recipes = await Recipe.find({ category }).select("_id title");
    console.log(
      `🔨 Rebuilding search index for category: ${category} (${recipes.length} recipes)`,
    );

    // Simulate batch indexing (100ms per recipe)
    await new Promise((resolve) => setTimeout(resolve, recipes.length * 100));

    return {
      category,
      recipesIndexed: recipes.length,
      indexed: true,
    };
  },

  /**
   * Rebuild entire search index
   * Called during major maintenance/schema changes
   * Re-indexes ALL recipes in database
   * Slow operation but ensures index consistency
   * Can take minutes on large indexes (1000+ recipes)
   *
   * @returns {Promise<Object>} Full rebuild statistics
   */
  rebuildFullIndex: async () => {
    // Fetch ALL recipes (minimal fields)
    const recipes = await Recipe.find({}).select("_id title category");
    console.log(`🔨 Rebuilding full search index (${recipes.length} recipes)`);

    // Simulate batch indexing (50ms per recipe)
    await new Promise((resolve) => setTimeout(resolve, recipes.length * 50));

    return {
      totalRecipes: recipes.length,
      indexed: true,
    };
  },
};

// ========== SEARCH INDEX JOB PROCESSOR ==========
/**
 * Bull queue processor for search index jobs
 * Runs when job is pulled from queue (by Redis)
 *
 * Process:
 *   1. Extract job data: action, recipeId, category
 *   2. Validate action field present
 *   3. Route to appropriate search operation based on action
 *   4. Execute search operation
 *   5. Return success response with metadata
 *
 * Actions:
 *   - add: Requires recipeId - add new recipe to index
 *   - update: Requires recipeId - update existing indexed recipe
 *   - delete: Requires recipeId - remove recipe from index
 *   - rebuild-category: Requires category - rebuild category index
 *   - rebuild-all: No parameters - rebuild entire index
 *
 * Error Handling:
 *   - Missing action field - throw with message
 *   - Missing required parameters for action - throw with message
 *   - Unknown action - throw with message
 *   - All throws trigger retry logic (attempts: 2)
 *
 * Retry Strategy (exponential backoff):
 *   - Attempt 1: Immediate
 *   - Attempt 2: After 2 seconds
 *   - If both fail: Job marked failed
 *
 * Timeout: 120 seconds (for large rebuild operations)
 *   - Typical operations take 1-5 seconds
 *   - rebuild-category might take 10-30 seconds
 *   - rebuild-all might take 1-10 minutes depending on size
 *
 * @param {Object} job - Bull job object with .data property
 * @returns {Promise<Object>} Success response with action results
 * @throws {Error} If job fails (triggers retry)
 */
searchQueue.process(async (job) => {
  const { action, recipeId, category } = job.data;

  try {
    // Validate action field present
    if (!action) {
      throw new Error("Missing required field: action");
    }

    // Route to appropriate search operation
    let result;
    switch (action) {
      case "add":
        // Add single recipe to index
        if (!recipeId) throw new Error("Missing recipeId for add action");
        result = await searchIndexOperations.addToIndex(recipeId);
        break;

      case "update":
        // Update single recipe in index
        if (!recipeId) throw new Error("Missing recipeId for update action");
        result = await searchIndexOperations.updateIndex(recipeId);
        break;

      case "delete":
        // Remove single recipe from index
        if (!recipeId) throw new Error("Missing recipeId for delete action");
        result = await searchIndexOperations.removeFromIndex(recipeId);
        break;

      case "rebuild-category":
        // Rebuild all recipe indexes in category
        if (!category)
          throw new Error("Missing category for rebuild-category action");
        result = await searchIndexOperations.rebuildCategoryIndex(category);
        break;

      case "rebuild-all":
        // Rebuild entire search index
        result = await searchIndexOperations.rebuildFullIndex();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Return success metadata
    return {
      success: true,
      action: action,
      result: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Log error with emoji prefix
    console.error("❌ Search index job failed:", error.message);
    // Re-throw to trigger retry logic
    throw error;
  }
});

// ========== QUEUE SEARCH INDEX UPDATE HELPER FUNCTION ==========
/**
 * Queues a search index update job for background processing
 * Non-blocking: Returns immediately without waiting for index update
 *
 * Usage in controllers:
 *   queueSearchIndexUpdate('add', recipeId)
 *   queueSearchIndexUpdate('update', recipeId)
 *   queueSearchIndexUpdate('delete', recipeId)
 *   queueSearchIndexUpdate('rebuild-category', null, 'Breakfast')
 *   queueSearchIndexUpdate('rebuild-all')
 *
 * Retry Configuration:
 *   - attempts: 2 - Try up to 2 times before giving up
 *   - backoff type: "exponential" - Wait increases exponentially (2s)
 *   - backoff delay: 2000ms - Base delay of 2 seconds
 *   - timeout: 120000ms - Maximum 2 minutes per attempt
 *   - removeOnComplete: true - Delete job from queue after success
 *
 * Failure Handling:
 *   - If both attempts fail, job moved to dead-letter queue
 *   - Can be retried manually or inspected via Bull dashboard
 *   - Not blocking: User sees success even if indexing fails
 *   - Fallback: MongoDB full-text queries still work (less efficient)
 *
 * Conditional Properties:
 *   - Uses conditional spread operators: ...(recipeId && { recipeId })
 *   - Only includes recipeId if provided (not null/undefined)
 *   - Only includes category if provided (not null/undefined)
 *   - Keeps job data minimal (only required fields)
 *
 * @param {String} action - "add" | "update" | "delete" | "rebuild-category" | "rebuild-all"
 * @param {String} recipeId - MongoDB recipe ID (required for add/update/delete, optional for rebuild)
 * @param {String} category - Category name (required for rebuild-category, optional otherwise)
 * @returns {Promise<Object>} Bull job object with job.id
 *
 * @example
 *   // Queue adding recipe to index
 *   await queueSearchIndexUpdate('add', '507f1f77bcf86cd799439011');
 *
 *   // Queue category rebuild
 *   await queueSearchIndexUpdate('rebuild-category', null, 'Breakfast');
 *
 *   // Queue full index rebuild
 *   await queueSearchIndexUpdate('rebuild-all');
 */
const queueSearchIndexUpdate = async (
  action,
  recipeId = null,
  category = null,
) => {
  // Default Bull queue configuration for search index jobs
  const defaultQueueOptions = {
    attempts: 2, // Fewer retries (not critical like emails)
    backoff: {
      type: "exponential", // Exponential backoff strategy
      delay: 2000, // Start with 2 second delay
    },
    timeout: 120000, // 120 seconds (2 minutes) for large rebuilds
    removeOnComplete: true, // Clean up after success
  };

  // Queue job with only required fields
  // Conditional spread prevents sending null/undefined values
  return await searchQueue.add(
    {
      action,
      ...(recipeId && { recipeId }), // Include only if provided
      ...(category && { category }), // Include only if provided
    },
    defaultQueueOptions,
  );
};

// ========== EXPORT QUEUE AND FUNCTIONS ==========
// Exports for use in controllers and services
//
// Usage:
//   const { queueSearchIndexUpdate } = require('./jobs/searchIndexProcessor');
//   queueSearchIndexUpdate('add', recipeId);
module.exports = {
  searchQueue, // Search Bull queue instance (used in initializeQueues.js)
  queueSearchIndexUpdate, // Function to queue search index updates
  searchIndexOperations, // Exported for testing or custom usage
};
