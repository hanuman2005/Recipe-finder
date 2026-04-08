// ========== RECIPE SERVICE - BUSINESS LOGIC LAYER ==========
// Handles all recipe-related database operations
// Separates business logic from HTTP controllers for clean architecture
// All methods are async and throw AppError on validation failures

const Recipe = require("../models/Recipe"); // Recipe MongoDB model
const User = require("../models/User"); // User MongoDB model
const AppError = require("../utils/AppError"); // Custom error class

// Singleton service instance - all recipe operations go through this class
class RecipeService {
  // ========== READ OPERATIONS ==========
  // GET operations: fetch recipes without modifying database

  /**
   * FUNCTION: Get single recipe by ID with populated user info
   * @param {String} id - Recipe MongoDB ID
   * @param {String} userId - User requesting (for authorization checks)
   * @returns {Object} Recipe document with user details
   * @throws {Error} If recipe not found
   */
  async getRecipeById(id, userId) {
    // Find recipe by ID and populate user's name/email instead of ID
    const recipe = await Recipe.findById(id).populate("user", "name email");

    // If no recipe found with this ID, throw NotFound error (404)
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { id });
    }

    return recipe;
  }

  /**
   * FUNCTION: Get all recipes with filtering, pagination, and sorting
   * Supports: category, state, search, equipment, prep/cook time, difficulty, rating
   * @param {Object} filters - Search filters object
   * @param {String} filters.category - Filter by recipe category
   * @param {String} filters.state - Filter by state/region
   * @param {Array} filters.equipment - Equipment names array (POWER FEATURE #3)
   * @param {String} filters.search - Search in title/description
   * @param {Number} filters.maxPrepTime - Filter by max prep time in minutes
   * @param {Number} filters.maxCookTime - Filter by max cook time in minutes
   * @param {String} filters.difficulty - Filter by difficulty level
   * @param {Number} filters.minRating - Filter by minimum rating
   * @param {Number} page - Page number for pagination (default: 1)
   * @param {Number} limit - Results per page (default: 10, max: 100)
   * @returns {Object} {data: recipes[], pagination: {total, page, limit, pages}}
   */
  async getAllRecipes(filters = {}, page = 1, limit = 10) {
    // Ensure page is at least 1 (not 0 or negative)
    page = Math.max(1, parseInt(page) || 1);

    // Ensure limit is between 1-100 (prevent huge queries or 0 results)
    limit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Build MongoDB query dynamically based on provided filters
    const query = {};

    // ========== FILTER 1: CATEGORY ==========
    // Only include recipes from specific category (e.g., "Italian", "Dessert")
    if (filters.category) query.category = filters.category;

    // ========== FILTER 2: STATE/REGION ==========
    // Only include recipes from specific state (e.g., "Maharashtra", "Tamil Nadu")
    if (filters.state) query.state = filters.state;

    // ========== FILTER 3: TEXT SEARCH ==========
    // Search in recipe title OR description (case-insensitive regex)
    // $or: Match if EITHER condition is true
    // $regex: Pattern matching, $options: "i" = case-insensitive
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    // ========== FILTER 4: EQUIPMENT (POWER FEATURE #3) ==========
    // User has specific equipment, show recipes that use those items
    // $in: Match if recipe.equipment contains ANY of user's equipment
    // Example: User has [pan, pot] → Show recipes that need pan OR pot
    if (
      filters.equipment &&
      Array.isArray(filters.equipment) &&
      filters.equipment.length > 0
    ) {
      query.equipment = { $in: filters.equipment };
    }

    // ========== FILTER 5: PREPARATION TIME ==========
    // $lte: Less than or equal to (if maxPrepTime=30, show recipes ≤30 min prep)
    if (filters.maxPrepTime) {
      query.prepTime = { $lte: parseInt(filters.maxPrepTime) };
    }

    // ========== FILTER 6: COOKING TIME ==========
    // $lte: Less than or equal to (if maxCookTime=45, show recipes ≤45 min cook time)
    if (filters.maxCookTime) {
      query.cookTime = { $lte: parseInt(filters.maxCookTime) };
    }

    // ========== FILTER 7: DIFFICULTY LEVEL ==========
    // Only include recipes at specific difficulty ("Easy", "Medium", "Hard")
    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    // ========== FILTER 8: MINIMUM RATING ==========
    // $gte: Greater than or equal to (if minRating=4.0, show recipes with rating ≥4.0)
    if (filters.minRating) {
      query.rating = { $gte: parseFloat(filters.minRating) };
    }

    // ========== EXECUTE QUERY ==========
    // Run two parallel queries for efficiency:
    // 1. Find recipes matching all filters with pagination
    // 2. Count total recipes matching filters (for pagination info)
    const [recipes, total] = await Promise.all([
      // Find recipes:
      Recipe.find(query)
        .populate("user", "name email") // Replace user ID with name+email
        .skip((page - 1) * limit) // Skip previous pages' results (pagination)
        .limit(limit) // Only return 'limit' results
        .sort({ rating: -1, createdAt: -1 }), // Sort by rating (high→low), then newest first

      // Count total matching without pagination
      Recipe.countDocuments(query),
    ]);

    // Return recipes + pagination metadata
    return {
      data: recipes, // Array of recipe documents
      pagination: {
        total, // Total recipes matching filters
        page, // Current page number
        limit, // Results per page
        pages: Math.ceil(total / limit), // Total number of pages
      },
    };
  }

  /**
   * FUNCTION: Get recipes filtered by category
   * @param {String} category - Category name (e.g., "Italian", "Indian")
   * @returns {Array} Array of Recipe documents
   * @throws {Error} If category missing or no recipes found
   */
  async getRecipesByCategory(category) {
    // Validate category provided
    if (!category) {
      throw AppError.badRequest("Category required", "MISSING_CATEGORY", {
        required: true,
      });
    }

    // Find all recipes with matching category, populate user info, sort by newest
    const recipes = await Recipe.find({ category })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // If no recipes found for this category
    if (!recipes || recipes.length === 0) {
      throw AppError.notFound(
        "No recipes found for this category",
        "NO_RECIPES_FOUND",
        { category },
      );
    }

    return recipes;
  }

  /**
   * FUNCTION: Get recipes filtered by state/region
   * @param {String} state - State name (e.g., "Maharashtra", "Kerala")
   * @returns {Array} Array of Recipe documents
   * @throws {Error} If state missing or no recipes found
   */
  async getRecipesByState(state) {
    // Validate state provided
    if (!state) {
      throw AppError.badRequest("State required", "MISSING_STATE", {
        required: true,
      });
    }

    // Find all recipes with matching state, populate user info, sort by newest
    const recipes = await Recipe.find({ state })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // If no recipes found for this state
    if (!recipes || recipes.length === 0) {
      throw AppError.notFound(
        "No recipes found for this state",
        "NO_RECIPES_FOUND",
        { state },
      );
    }

    return recipes;
  }

  /**
   * FUNCTION: Search recipes by text (title OR description)
   * Case-insensitive full-text search
   * @param {String} query - Search term
   * @returns {Array} Array of matching Recipe documents
   * @throws {Error} If query empty
   */
  async searchRecipes(query) {
    // Validate search query not empty
    if (!query || !query.trim()) {
      throw AppError.badRequest("Search query required", "EMPTY_QUERY", {
        minLength: 1,
      });
    }

    // Find recipes where title OR description CONTAINS search term (case-insensitive)
    // $or: Match if EITHER condition is true
    // $regex: Pattern matching on the string
    return await Recipe.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).populate("user", "name email");
  }

  /**
   * FUNCTION: Smart Search - MongoDB Text Search with Weighted Relevance Scoring
   * TASK 2: Uses weighted text index for intelligent recipe discovery
   * Weights: title (10x) > description (5x) > ingredients (3x) > category (2x)
   * Example: "Chicken" in title ranks higher than "Chicken" in ingredients
   * @param {String} query - Search query (required)
   * @param {Number} page - Page number for pagination (default: 1)
   * @param {Number} limit - Results per page (default: 20)
   * @returns {Object} {data: recipes[], total: count}
   * @throws {Error} If query empty
   */
  async smartSearch(query, page = 1, limit = 20) {
    // ========== VALIDATE INPUT ==========
    if (!query || !query.trim()) {
      throw AppError.badRequest("Search query required", "EMPTY_QUERY", {
        minLength: 1,
      });
    }

    // Ensure pagination values are valid
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // ========== EXECUTE WEIGHTED TEXT SEARCH ==========
    // $text operator uses the weighted text index created in Recipe model
    // Weights defined in index: title: 10, description: 5, ingredients: 3, etc.
    // $meta: "textScore" returns relevance score for each result

    const [recipes, total] = await Promise.all([
      // Query 1: Find recipes and sort by relevance score
      Recipe.find(
        { $text: { $search: query } }, // Text search using weighted index
        { score: { $meta: "textScore" } }, // Add relevance score to results
      )
        .sort({ score: { $meta: "textScore" } }) // Sort by relevance (highest first)
        .skip((page - 1) * limit) // Pagination: skip previous pages
        .limit(parseInt(limit)) // Pagination: limit results per page
        .populate("user", "name email"), // Populate user info instead of ID

      // Query 2: Count total results matching query
      Recipe.countDocuments({
        $text: { $search: query },
      }),
    ]);

    // Return results with metadata
    return {
      data: recipes, // Array of recipes sorted by relevance score
      total, // Total recipes matching the search
    };
  }

  /**
   * FUNCTION: Get all recipes created by specific user
   * @param {String} userId - User's MongoDB ID
   * @returns {Array} Array of Recipe documents
   * @throws {Error} If user not found
   */
  async getUserRecipes(userId) {
    // Verify user exists
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Find all recipes where user is the creator, populate user info, sort by newest
    return await Recipe.find({ user: userId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
  }

  /**
   * FUNCTION: Get user's favorite recipes (they marked as favorites)
   * @param {String} userId - User's MongoDB ID
   * @returns {Array} Array of Recipe documents (from user.favorites array)
   * @throws {Error} If user not found
   */
  async getUserFavorites(userId) {
    // Find user and populate favorites array with full recipe documents
    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Return favorites array (or empty array if no favorites)
    return user.favorites || [];
  }

  // ========== CREATE OPERATIONS ==========
  // POST operations: create new recipe documents

  /**
   * FUNCTION: Create new recipe
   * Validates all required fields and sets defaults for optional ones
   * @param {Object} data - Recipe data from request body
   * @param {String} data.title - Recipe title (required)
   * @param {String} data.description - Recipe description (required)
   * @param {Array} data.ingredients - List of ingredients (required, min 1)
   * @param {Array} data.steps - Cooking steps (required, min 1)
   * @param {String} data.category - Category (optional, default: "Other")
   * @param {String} data.state - State/region (optional, default: "Unknown")
   * @param {String} data.benefits - Health benefits description (optional)
   * @param {String} data.image - Image URL (optional)
   * @param {String} data.difficulty - Difficulty level (optional, default: "Medium")
   * @param {Number} data.prepTime - Prep time in minutes (optional, default: 30)
   * @param {Number} data.cookTime - Cook time in minutes (optional, default: 30)
   * @param {Number} data.servings - Number of servings (optional, default: 4)
   * @param {Array} data.equipment - Equipment needed (POWER FEATURE #3)
   * @param {String} userId - Creator's user ID
   * @returns {Object} Created Recipe document with user info populated
   * @throws {Error} If required fields missing or array validations fail
   */
  async createRecipe(data, userId) {
    // ========== EXTRACT DATA ==========
    const {
      title,
      description,
      ingredients,
      steps,
      category,
      state,
      benefits,
      image,
      difficulty,
      prepTime,
      cookTime,
      servings,
      equipment, // ===== POWER FEATURE #3: Equipment list =====
    } = data;

    // ========== VALIDATE REQUIRED FIELDS ==========
    if (!title || !description) {
      throw AppError.badRequest(
        "Title and description required",
        "MISSING_FIELDS",
        { fields: ["title", "description"] },
      );
    }

    // ========== VALIDATE INGREDIENTS ARRAY ==========
    // Must be array and have at least 1 ingredient
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw AppError.badRequest(
        "Ingredients required and must be an array",
        "MISSING_INGREDIENTS",
        { minItems: 1 },
      );
    }

    // ========== VALIDATE STEPS ARRAY ==========
    // Must be array and have at least 1 step
    if (!Array.isArray(steps) || steps.length === 0) {
      throw AppError.badRequest(
        "Steps required and must be an array",
        "MISSING_STEPS",
        { minItems: 1 },
      );
    }

    // ========== CREATE DOCUMENT ==========
    const recipe = await Recipe.create({
      title, // User-provided title
      description, // User-provided description
      ingredients, // User-provided ingredients array
      steps, // User-provided steps array
      category: category || "Other", // Default to "Other" if not provided
      state: state || "Unknown", // Default to "Unknown" if not provided
      benefits: benefits || "", // Default to empty string if not provided
      image: image || "", // Default to empty string if not provided
      difficulty: difficulty || "Medium", // Default to "Medium" if not provided
      prepTime: prepTime || 30, // Default to 30 minutes if not provided
      cookTime: cookTime || 30, // Default to 30 minutes if not provided
      servings: servings || 4, // Default to 4 servings if not provided
      equipment: equipment || [], // POWER FEATURE #3: Default to empty array if not provided
      user: userId, // Creator's user ID
      createdAt: new Date(), // Timestamp of creation
      updatedAt: new Date(), // Last update timestamp
    });

    // Populate user info before returning
    return await recipe.populate("user", "name email");
  }

  // ========== UPDATE OPERATIONS ==========
  // PUT/PATCH operations: modify existing recipe documents

  /**
   * FUNCTION: Update existing recipe
   * Only recipe creator can update their own recipes
   * @param {String} id - Recipe MongoDB ID
   * @param {Object} data - Fields to update (partial update allowed)
   * @param {String} userId - User updating (authentication guard)
   * @returns {Object} Updated Recipe document with user info populated
   * @throws {Error} If recipe not found or user not authorized
   */
  async updateRecipe(id, data, userId) {
    // ========== FIND RECIPE ==========
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { id });
    }

    // ========== CHECK AUTHORIZATION ==========
    // Only recipe creator can update it
    if (recipe.user.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to update this recipe",
        "FORBIDDEN_UPDATE",
        { id, userId },
      );
    }

    // ========== PREVENT SENSITIVE FIELD UPDATES ==========
    delete data.user; // Cannot change creator
    delete data.createdAt; // Cannot change creation date
    data.updatedAt = new Date(); // Update the "last modified" timestamp

    // ========== UPDATE AND RETURN ==========
    return await Recipe.findByIdAndUpdate(id, data, { new: true }).populate(
      "user",
      "name email",
    );
  }

  /**
   * FUNCTION: Add recipe to user's favorites
   * Adds recipe ID to user's favorites array (if not already there)
   * @param {String} recipeId - Recipe MongoDB ID
   * @param {String} userId - User's MongoDB ID
   * @returns {Array} Updated user's favorites array
   * @throws {Error} If recipe or user not found
   */
  async addToFavorites(recipeId, userId) {
    // ========== VERIFY RECIPE EXISTS ==========
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    // ========== VERIFY USER EXISTS ==========
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== ADD TO FAVORITES IF NOT ALREADY IN LIST ==========
    if (!user.favorites.includes(recipeId)) {
      user.favorites.push(recipeId); // Add recipe to favorites array
      await user.save(); // Save changes to database
    }

    // Return updated favorites array
    return user.favorites;
  }

  /**
   * FUNCTION: Remove recipe from user's favorites
   * Removes recipe ID from user's favorites array
   * @param {String} recipeId - Recipe MongoDB ID to remove
   * @param {String} userId - User's MongoDB ID
   * @returns {Array} Updated user's favorites array
   * @throws {Error} If user not found
   */
  async removeFromFavorites(recipeId, userId) {
    // ========== FIND USER ==========
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== REMOVE FROM FAVORITES ==========
    // Filter out the recipe ID from favorites array (keep all except the removed one)
    user.favorites = user.favorites.filter((id) => id.toString() !== recipeId);

    // Save changes to database
    await user.save();

    // Return updated favorites array
    return user.favorites;
  }

  // ========== DELETE OPERATIONS ==========
  // DELETE operations: remove recipe from database

  /**
   * FUNCTION: Delete recipe
   * Only recipe creator can delete their own recipes
   * @param {String} id - Recipe MongoDB ID
   * @param {String} userId - User deleting (authentication guard)
   * @throws {Error} If recipe not found or user not authorized
   */
  async deleteRecipe(id, userId) {
    // ========== FIND RECIPE ==========
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { id });
    }

    // ========== CHECK AUTHORIZATION ==========
    // Only recipe creator can delete it
    if (recipe.user.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to delete this recipe",
        "FORBIDDEN_DELETE",
        { id, userId },
      );
    }

    // ========== DELETE RECIPE ==========
    // Remove recipe from database permanently
    await Recipe.findByIdAndDelete(id);
  }
}

// ========== SINGLETON EXPORT ==========
// Export single instance of RecipeService for use throughout backend
// Usage: const service = require('./recipeService'); service.getRecipeById(id)
module.exports = new RecipeService();
