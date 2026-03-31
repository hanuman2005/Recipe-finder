/**
 * Search Index Update Processor
 * Handles updating search indexes, rebuilding indexes for recipes
 *
 * Job Data Format:
 * {
 *   action: "add" | "update" | "delete" | "rebuild",
 *   recipeId: "ObjectId",
 *   category: "string" (optional),
 *   state: "string" (optional)
 * }
 */

const { searchQueue } = require("./queueConfig");
const Recipe = require("../models/Recipe");

/**
 * Mock Search Index Functions
 * Replace with real search engines: Elasticsearch, Algolia, Meilisearch, etc.
 */
const searchIndexOperations = {
  // Add recipe to search index
  addToIndex: async (recipeId) => {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

    console.log(`🔍 Adding recipe ${recipeId} to search index`);
    // Simulate index operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      recipeId,
      title: recipe.title,
      category: recipe.category,
      indexed: true,
    };
  },

  // Update recipe in search index
  updateIndex: async (recipeId) => {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

    console.log(`🔄 Updating recipe ${recipeId} in search index`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      recipeId,
      title: recipe.title,
      category: recipe.category,
      updated: true,
    };
  },

  // Remove recipe from search index
  removeFromIndex: async (recipeId) => {
    console.log(`🗑️ Removing recipe ${recipeId} from search index`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      recipeId,
      removed: true,
    };
  },

  // Rebuild entire search index (for all recipes in category)
  rebuildCategoryIndex: async (category) => {
    const recipes = await Recipe.find({ category }).select("_id title");
    console.log(
      `🔨 Rebuilding search index for category: ${category} (${recipes.length} recipes)`,
    );

    // Simulate batch indexing
    await new Promise((resolve) => setTimeout(resolve, recipes.length * 100));

    return {
      category,
      recipesIndexed: recipes.length,
      indexed: true,
    };
  },

  // Rebuild entire search index
  rebuildFullIndex: async () => {
    const recipes = await Recipe.find({}).select("_id title category");
    console.log(`🔨 Rebuilding full search index (${recipes.length} recipes)`);

    // Simulate batch indexing
    await new Promise((resolve) => setTimeout(resolve, recipes.length * 50));

    return {
      totalRecipes: recipes.length,
      indexed: true,
    };
  },
};

/**
 * Process Search Index Jobs
 */
searchQueue.process(async (job) => {
  const { action, recipeId, category } = job.data;

  try {
    // Validate required fields
    if (!action) {
      throw new Error("Missing required field: action");
    }

    let result;
    switch (action) {
      case "add":
        if (!recipeId) throw new Error("Missing recipeId for add action");
        result = await searchIndexOperations.addToIndex(recipeId);
        break;

      case "update":
        if (!recipeId) throw new Error("Missing recipeId for update action");
        result = await searchIndexOperations.updateIndex(recipeId);
        break;

      case "delete":
        if (!recipeId) throw new Error("Missing recipeId for delete action");
        result = await searchIndexOperations.removeFromIndex(recipeId);
        break;

      case "rebuild-category":
        if (!category)
          throw new Error("Missing category for rebuild-category action");
        result = await searchIndexOperations.rebuildCategoryIndex(category);
        break;

      case "rebuild-all":
        result = await searchIndexOperations.rebuildFullIndex();
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
    console.error("❌ Search index job failed:", error.message);
    throw error;
  }
});

/**
 * Helper function to queue search index update
 *
 * @param {string} action - Action type (add, update, delete, rebuild-category, rebuild-all)
 * @param {string} recipeId - Recipe ID (required for add, update, delete)
 * @param {string} category - Category (required for rebuild-category)
 */
const queueSearchIndexUpdate = async (
  action,
  recipeId = null,
  category = null,
) => {
  const defaultQueueOptions = {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    timeout: 120000, // 120 seconds for search rebuilding
    removeOnComplete: true,
  };

  return await searchQueue.add(
    {
      action,
      ...(recipeId && { recipeId }),
      ...(category && { category }),
    },
    defaultQueueOptions,
  );
};

module.exports = {
  searchQueue,
  queueSearchIndexUpdate,
  searchIndexOperations,
};
