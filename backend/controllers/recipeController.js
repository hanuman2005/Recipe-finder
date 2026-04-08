// ========== RECIPE CONTROLLER - HTTP REQUEST HANDLERS ==========
// Handles all HTTP requests for recipe endpoints
// Responsibility: Parse request → Call service → Format response
// Does NOT contain business logic (that's in recipeService.js)

// Import business logic layer (service)
const recipeService = require("../services/recipeService");
// Import background job queues
const { queueImageProcessing } = require("../jobs/imageProcessor"); // Image optimization jobs
const { queueSearchIndexUpdate } = require("../jobs/searchIndexProcessor"); // Search indexing jobs
const { queueCleanup } = require("../jobs/cleanupProcessor"); // Cleanup jobs
// Import response formatting utilities
const {
  sendError,
  sendSuccess,
  sendPaginated,
} = require("../utils/responseHandler");

// ========== GET OPERATIONS / READ ==========
// These handlers retrieve recipes without modifying data

/**
 * HANDLER: GET /api/recipes/:id
 * Get single recipe by ID with full details
 * @route GET /api/recipes/:id
 * @param {String} req.params.id - Recipe MongoDB ID
 * @returns {200} Recipe object with user details
 * @returns {404} If recipe not found
 */
exports.getRecipeById = async (req, res) => {
  try {
    // Call service layer to fetch recipe from database
    const recipe = await recipeService.getRecipeById(
      req.params.id,
      req.user?._id, // Optional: user ID for authorization checks
    );

    // Success response: status 200, message, and recipe data
    sendSuccess(res, 200, "Recipe retrieved successfully", recipe);
  } catch (error) {
    // Error response: recipe not found (404)
    sendError(res, 404, "RECIPE_NOT_FOUND", error.message, {
      id: req.params.id,
    });
  }
};

/**
 * HANDLER: GET /api/recipes
 * Get all recipes with filtering, pagination, and sorting
 * Supports equipment filter (POWER FEATURE #3)
 * @route GET /api/recipes?category=Italian&page=1&limit=10&equipment=pan,pot
 * @query {String} category - Filter by category
 * @query {String} state - Filter by state/region
 * @query {String} search - Search in title/description
 * @query {String} equipment - Comma-separated equipment names (POWER FEATURE #3)
 * @query {Number} maxPrepTime - Max prep time in minutes
 * @query {Number} maxCookTime - Max cook time in minutes
 * @query {String} difficulty - Filter by difficulty level
 * @query {Number} minRating - Filter by minimum rating (1-5)
 * @query {Number} page - Page number for pagination (default: 1)
 * @query {Number} limit - Results per page (default: 10)
 * @returns {200} Paginated recipes array with pagination metadata
 */
exports.getRecipes = async (req, res) => {
  try {
    // ========== EXTRACT QUERY PARAMETERS ==========
    // These are already validated by Zod middleware
    const {
      category,
      state,
      search,
      equipment,
      maxPrepTime,
      maxCookTime,
      difficulty,
      minRating,
      page,
      limit,
    } = req.query;

    // ========== CONVERT EQUIPMENT TO ARRAY ==========
    // Equipment comes as comma-separated string: "pan,pot,knife"
    // Convert to array: ["pan", "pot", "knife"] for database query
    const equipmentArray = equipment
      ? typeof equipment === "string"
        ? equipment.split(",").map((e) => e.trim()) // Split and trim whitespace
        : equipment
      : undefined;

    // ========== BUILD FILTERS OBJECT ==========
    // Only include filters that were provided (conditional spread syntax)
    // Empty filters {} = get all recipes
    const filters = {
      ...(category && { category }), // Include only if category provided
      ...(state && { state }),
      ...(search && { search }),
      // POWER FEATURE #3: Equipment filter - finds recipes using selected equipment
      ...(equipmentArray &&
        equipmentArray.length > 0 && { equipment: equipmentArray }),
      ...(maxPrepTime && { maxPrepTime: parseInt(maxPrepTime) }),
      ...(maxCookTime && { maxCookTime: parseInt(maxCookTime) }),
      ...(difficulty && { difficulty }),
      ...(minRating && { minRating: parseFloat(minRating) }),
    };

    // ========== CALL SERVICE ==========
    // Service layer performs database queries and filtering
    const result = await recipeService.getAllRecipes(filters, page, limit);

    // ========== SEND PAGINATED RESPONSE ==========
    // Include data, pagination info (total, page, pages), and count
    sendPaginated(
      res,
      200,
      "Recipes retrieved successfully",
      result.data, // Array of recipes
      result.pagination, // {total, page, limit, pages}
    );
  } catch (error) {
    // Error response: internal server error (500)
    sendError(res, 500, "RECIPES_FETCH_FAILED", error.message);
  }
};

/**
 * HANDLER: GET /api/recipes/category/:category
 * Get all recipes from specific category
 * @route GET /api/recipes/category/Italian
 * @param {String} req.params.category - Category name
 * @returns {200} Array of recipes in category
 * @returns {404} If no recipes found
 */
exports.getRecipesByCategory = async (req, res) => {
  try {
    // Call service to fetch recipes by category
    const recipes = await recipeService.getRecipesByCategory(
      req.params.category,
    );

    // Success response
    sendSuccess(res, 200, "Recipes retrieved by category", recipes);
  } catch (error) {
    // Determine status code: 404 if not found, 400 for other errors
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "NO_RECIPES_FOUND" : "RECIPES_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, {
      category: req.params.category,
    });
  }
};

/**
 * HANDLER: GET /api/recipes/state/:state
 * Get all recipes from specific state/region
 * @route GET /api/recipes/state/Maharashtra
 * @param {String} req.params.state - State/region name
 * @returns {200} Array of recipes from state
 * @returns {404} If no recipes found
 */
exports.getRecipesByState = async (req, res) => {
  try {
    // Call service to fetch recipes by state
    const recipes = await recipeService.getRecipesByState(req.params.state);

    // Success response
    sendSuccess(res, 200, "Recipes retrieved by state", recipes);
  } catch (error) {
    // Error handling
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "NO_RECIPES_FOUND" : "RECIPES_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, {
      state: req.params.state,
    });
  }
};

/**
 * HANDLER: GET /api/recipes/search
 * Search recipes by title or description (text search)
 * @route GET /api/recipes/search?title=pasta
 * @query {String} title - Search term (required)
 * @returns {200} Array of matching recipes
 * @returns {400} If search query missing
 */
exports.searchRecipes = async (req, res) => {
  try {
    // ========== VALIDATE SEARCH QUERY ==========
    // Search query must be provided
    if (!req.query.title)
      return sendError(
        res,
        400,
        "MISSING_SEARCH_QUERY",
        "Search query required",
        { minLength: 1 },
      );

    // ========== CALL SERVICE ==========
    // Service performs case-insensitive regex search in title + description
    const recipes = await recipeService.searchRecipes(req.query.title);

    // Success response
    sendSuccess(res, 200, "Recipes found", recipes);
  } catch (error) {
    // Error response: internal server error (500)
    sendError(res, 500, "SEARCH_FAILED", error.message, {
      query: req.query.title,
    });
  }
};

/**
 * HANDLER: GET /api/recipes/smart-search
 * TASK 2: Smart Search API - MongoDB text search with weighted relevance
 * Uses weighted text index: title (10x) > description (5x) > ingredients (3x)
 * Example: "Chicken masala" returns dishes matching "Chicken" in title first
 * @route GET /api/recipes/smart-search?query=chicken&page=1&limit=20
 * @param {String} req.query.query - Search query (required)
 * @param {Number} req.query.page - Page number for pagination (default: 1)
 * @param {Number} req.query.limit - Results per page (default: 20)
 * @returns {200} Sorted array of matching recipes by relevance score
 * @returns {400} If search query missing
 */
exports.smartSearch = async (req, res) => {
  try {
    // ========== VALIDATE SEARCH QUERY ==========
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim() === "") {
      return sendError(
        res,
        400,
        "MISSING_SEARCH_QUERY",
        "Search query required",
        { example: "?query=chicken&page=1&limit=20" },
      );
    }

    // ========== CALL SERVICE ==========
    // Service uses MongoDB $text operator with weighted index
    const results = await recipeService.smartSearch(
      query,
      parseInt(page),
      parseInt(limit),
    );

    // Success response with pagination info
    sendPaginated(
      res,
      200,
      `Found ${results.data.length} recipes matching "${query}"`,
      results.data,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.total,
        pages: Math.ceil(results.total / parseInt(limit)),
      },
    );
  } catch (error) {
    // Error response: internal server error
    sendError(res, 500, "SMART_SEARCH_FAILED", error.message, {
      query: req.query.query,
    });
  }
};

/**
 * HANDLER: GET /api/recipes/user/my-recipes
 * Get all recipes created by authenticated user
 * @route GET /api/recipes/user/my-recipes
 * @requires Authentication (JWT token, req.user._id)
 * @returns {200} Array of user's recipes
 */
exports.getUserRecipes = async (req, res) => {
  try {
    // Call service with user ID from authenticated request
    const recipes = await recipeService.getUserRecipes(req.user._id);

    // Success response
    sendSuccess(res, 200, "User recipes retrieved", recipes);
  } catch (error) {
    // Error response
    sendError(res, 500, "USER_RECIPES_FETCH_FAILED", error.message, {
      userId: req.user._id,
    });
  }
};

/**
 * HANDLER: GET /api/recipes/user/favorites
 * Get all recipes user marked as favorites
 * @route GET /api/recipes/user/favorites
 * @requires Authentication (JWT token, req.user._id)
 * @returns {200} Array of favorite recipes
 */
exports.getUserFavoriteRecipes = async (req, res) => {
  try {
    // Call service with user ID from authenticated request
    const favorites = await recipeService.getUserFavorites(req.user._id);

    // Success response
    sendSuccess(res, 200, "Favorite recipes retrieved", favorites);
  } catch (error) {
    // Error response
    sendError(res, 500, "FAVORITES_FETCH_FAILED", error.message, {
      userId: req.user._id,
    });
  }
};

// ========== CREATE OPERATIONS / POST ==========

/**
 * HANDLER: POST /api/recipes
 * Create new recipe (admin/user)
 * Triggers background jobs: image optimization, search indexing
 * @route POST /api/recipes
 * @requires Authentication (JWT token, req.user._id)
 * @body {String} title - Recipe title (required)
 * @body {String} description - Recipe description (required)
 * @body {Array} ingredients - List of ingredients (required)
 * @body {Array} steps - Cooking steps (required)
 * @body {String} category - Category name (optional)
 * @body {String} state - State/region (optional)
 * @body {String} image - Image URL (optional)
 * @body {Array} equipment - Equipment needed (POWER FEATURE #3, optional)
 * @returns {201} Created Recipe object with user details
 * @returns {400} If validation fails
 */
exports.createRecipe = async (req, res) => {
  try {
    // ========== CALL SERVICE ==========
    // Service validates all fields and saves to database
    const recipe = await recipeService.createRecipe(req.body, req.user._id);

    // ========== QUEUE BACKGROUND JOBS (NON-BLOCKING) ==========
    // These jobs run in background via Bull queue, don't block response

    // Job 1: Image optimization (resize, compress, convert format)
    if (recipe.image) {
      queueImageProcessing(recipe._id, recipe.image, "optimize").catch(
        (err) => {
          // Log error but don't fail the request
          console.error("Failed to queue image processing:", err.message);
        },
      );
    }

    // Job 2: Search index update (add recipe to search indexes)
    queueSearchIndexUpdate("add", recipe._id).catch((err) => {
      // Log error but don't fail the request
      console.error("Failed to queue search index update:", err.message);
    });

    // ========== SEND RESPONSE ==========
    // Return created recipe immediately (background jobs continue independently)
    sendSuccess(res, 201, "Recipe created successfully", recipe);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "RECIPE_CREATE_FAILED", error.message);
  }
};

// ========== UPDATE OPERATIONS / PUT ==========

/**
 * HANDLER: PUT /api/recipes/:id
 * Update existing recipe
 * Only recipe creator can update
 * @route PUT /api/recipes/:id
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.id - Recipe MongoDB ID
 * @body {Object} data - Fields to update (partial update allowed)
 * @returns {200} Updated Recipe object
 * @returns {403} If user not authorized (not creator)
 * @returns {404} If recipe not found
 */
exports.updateRecipe = async (req, res) => {
  try {
    // Call service with recipe ID, update data, and user ID for authorization
    const recipe = await recipeService.updateRecipe(
      req.params.id,
      req.body,
      req.user._id,
    );

    // Success response
    sendSuccess(res, 200, "Recipe updated successfully", recipe);
  } catch (error) {
    // Determine status code: 403 if authorization failed, 400 for other errors
    const status = error.message.includes("Not authorized") ? 403 : 400;
    const code = status === 403 ? "NOT_AUTHORIZED" : "RECIPE_UPDATE_FAILED";
    sendError(res, status, code, error.message, { id: req.params.id });
  }
};

// ========== DELETE OPERATIONS ==========

/**
 * HANDLER: DELETE /api/recipes/:id
 * Delete recipe permanently
 * Only recipe creator can delete
 * Triggers background jobs: cleanup, search index removal
 * @route DELETE /api/recipes/:id
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.id - Recipe MongoDB ID
 * @returns {200} Success message
 * @returns {403} If user not authorized (not creator)
 * @returns {404} If recipe not found
 */
exports.deleteRecipe = async (req, res) => {
  try {
    // ========== CALL SERVICE ==========
    // Service deletes recipe and checks authorization
    await recipeService.deleteRecipe(req.params.id, req.user._id);

    // ========== QUEUE BACKGROUND JOBS (NON-BLOCKING) ==========
    // These jobs run in background via Bull queue

    // Job 1: Cleanup (delete associated files, images, data)
    queueCleanup("delete-recipe", req.params.id).catch((err) => {
      // Log error but don't fail the request
      console.error("Failed to queue cleanup:", err.message);
    });

    // Job 2: Search index removal (remove from search indexes)
    queueSearchIndexUpdate("delete", req.params.id).catch((err) => {
      // Log error but don't fail the request
      console.error("Failed to queue search index update:", err.message);
    });

    // ========== SEND RESPONSE ==========
    // Return success immediately (background jobs continue independently)
    sendSuccess(res, 200, "Recipe deleted successfully");
  } catch (error) {
    // Determine status code: 403 if authorization failed, 400 for other errors
    const status = error.message.includes("Not authorized") ? 403 : 400;
    const code = status === 403 ? "FORBIDDEN_DELETE" : "RECIPE_DELETE_FAILED";
    sendError(res, status, code, error.message, { id: req.params.id });
  }
};

// ========== FAVORITES MANAGEMENT ==========

/**
 * HANDLER: POST /api/recipes/:id/favorite
 * Add recipe to user's favorites
 * @route POST /api/recipes/:id/favorite
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.id - Recipe MongoDB ID
 * @returns {200} Updated favorites array
 * @returns {404} If recipe not found
 * @returns {409} If already in favorites
 */
exports.addToFavorites = async (req, res) => {
  try {
    // Call service to add recipe to user's favorites
    const favorites = await recipeService.addToFavorites(
      req.params.id,
      req.user._id,
    );

    // Success response with updated favorites list
    sendSuccess(res, 200, "Recipe added to favorites", { favorites });
  } catch (error) {
    // Determine status code: 404 if recipe not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "RECIPE_NOT_FOUND" : "FAVORITES_UPDATE_FAILED";
    sendError(res, statusCode, code, error.message, { recipe: req.params.id });
  }
};

/**
 * HANDLER: DELETE /api/recipes/:id/favorite
 * Remove recipe from user's favorites
 * @route DELETE /api/recipes/:id/favorite
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.id - Recipe MongoDB ID
 * @returns {200} Updated favorites array
 * @returns {404} If recipe not found or not in favorites
 */
exports.removeFromFavorites = async (req, res) => {
  try {
    // Call service to remove recipe from user's favorites
    const favorites = await recipeService.removeFromFavorites(
      req.params.id,
      req.user._id,
    );

    // Success response with updated favorites list
    sendSuccess(res, 200, "Recipe removed from favorites", { favorites });
  } catch (error) {
    // Determine status code: 404 if recipe not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "RECIPE_NOT_FOUND" : "FAVORITES_UPDATE_FAILED";
    sendError(res, statusCode, code, error.message, { recipe: req.params.id });
  }
};
