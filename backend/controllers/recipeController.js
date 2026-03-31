const recipeService = require("../services/recipeService");
const { queueImageProcessing } = require("../jobs/imageProcessor");
const { queueSearchIndexUpdate } = require("../jobs/searchIndexProcessor");
const { queueCleanup } = require("../jobs/cleanupProcessor");
const {
  sendError,
  sendSuccess,
  sendPaginated,
} = require("../utils/responseHandler");

// ==================== READ ====================

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await recipeService.getRecipeById(
      req.params.id,
      req.user?._id,
    );
    sendSuccess(res, 200, "Recipe retrieved successfully", recipe);
  } catch (error) {
    sendError(res, 404, "RECIPE_NOT_FOUND", error.message, { id: req.params.id });
  }
};

exports.getRecipes = async (req, res) => {
  try {
    const { category, state, search, page, limit } = req.query;
    const filters = {
      ...(category && { category }),
      ...(state && { state }),
      ...(search && { search }),
    };
    const result = await recipeService.getAllRecipes(filters, page, limit);
    sendPaginated(res, 200, "Recipes retrieved successfully", result.data, result.pagination);
  } catch (error) {
    sendError(res, 500, "RECIPES_FETCH_FAILED", error.message);
  }
};

exports.getRecipesByCategory = async (req, res) => {
  try {
    const recipes = await recipeService.getRecipesByCategory(
      req.params.category,
    );
    sendSuccess(res, 200, "Recipes retrieved by category", recipes);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code = statusCode === 404 ? "NO_RECIPES_FOUND" : "RECIPES_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, { category: req.params.category });
  }
};

exports.getRecipesByState = async (req, res) => {
  try {
    const recipes = await recipeService.getRecipesByState(req.params.state);
    sendSuccess(res, 200, "Recipes retrieved by state", recipes);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code = statusCode === 404 ? "NO_RECIPES_FOUND" : "RECIPES_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, { state: req.params.state });
  } 
};

exports.searchRecipes = async (req, res) => {
  try {
    if (!req.query.title)
      return sendError(res, 400, "MISSING_SEARCH_QUERY", "Search query required", { minLength: 1 });
    const recipes = await recipeService.searchRecipes(req.query.title);
    sendSuccess(res, 200, "Recipes found", recipes);
  } catch (error) {
    sendError(res, 500, "SEARCH_FAILED", error.message, { query: req.query.title });
  }
};

exports.getUserRecipes = async (req, res) => {
  try {
    const recipes = await recipeService.getUserRecipes(req.user._id);
    sendSuccess(res, 200, "User recipes retrieved", recipes);
  } catch (error) {
    sendError(res, 500, "USER_RECIPES_FETCH_FAILED", error.message, { userId: req.user._id });
  }
};

exports.getUserFavoriteRecipes = async (req, res) => {
  try {
    const favorites = await recipeService.getUserFavorites(req.user._id);
    sendSuccess(res, 200, "Favorite recipes retrieved", favorites);
  } catch (error) {
    sendError(res, 500, "FAVORITES_FETCH_FAILED", error.message, { userId: req.user._id });
  }
};

// ==================== CREATE ====================

exports.createRecipe = async (req, res) => {
  try {
    const recipe = await recipeService.createRecipe(req.body, req.user._id);

    // Queue image processing (background job - doesn't block response)
    if (recipe.image) {
      queueImageProcessing(recipe._id, recipe.image, "optimize").catch(
        (err) => {
          console.error("Failed to queue image processing:", err.message);
        },
      );
    }

    // Queue search index update (background job)
    queueSearchIndexUpdate("add", recipe._id).catch((err) => {
      console.error("Failed to queue search index update:", err.message);
    });

    sendSuccess(res, 201, "Recipe created successfully", recipe);
  } catch (error) {
    sendError(res, 400, "RECIPE_CREATE_FAILED", error.message);
  }
};

// ==================== UPDATE ====================

exports.updateRecipe = async (req, res) => {
  try {
    const recipe = await recipeService.updateRecipe(
      req.params.id,
      req.body,
      req.user._id,
    );
    res
      .status(200)
      .json({ success: true, data: recipe, message: "Recipe updated" });
  } catch (error) {
    const status = error.message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

// ==================== DELETE ====================

exports.deleteRecipe = async (req, res) => {
  try {
    await recipeService.deleteRecipe(req.params.id, req.user._id);

    // Queue cleanup operations (background job - doesn't block response)
    queueCleanup("delete-recipe", req.params.id).catch((err) => {
      console.error("Failed to queue cleanup:", err.message);
    });

    // Queue search index removal
    queueSearchIndexUpdate("delete", req.params.id).catch((err) => {
      console.error("Failed to queue search index update:", err.message);
    });

    sendSuccess(res, 200, "Recipe deleted successfully");
  } catch (error) {
    const status = error.message.includes("Not authorized") ? 403 : 400;
    const code = status === 403 ? "FORBIDDEN_DELETE" : "RECIPE_DELETE_FAILED";
    sendError(res, status, code, error.message, { id: req.params.id });
  }
};

// ==================== FAVORITES ====================

exports.addToFavorites = async (req, res) => {
  try {
    const favorites = await recipeService.addToFavorites(
      req.params.id,
      req.user._id,
    );
    sendSuccess(res, 200, "Recipe added to favorites", { favorites });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code = statusCode === 404 ? "RECIPE_NOT_FOUND" : "FAVORITES_UPDATE_FAILED";
    sendError(res, statusCode, code, error.message, { recipe: req.params.id });
  }
};

exports.removeFromFavorites = async (req, res) => {
  try {
    const favorites = await recipeService.removeFromFavorites(
      req.params.id,
      req.user._id,
    );
    sendSuccess(res, 200, "Recipe removed from favorites", { favorites });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code = statusCode === 404 ? "RECIPE_NOT_FOUND" : "FAVORITES_UPDATE_FAILED";
    sendError(res, statusCode, code, error.message, { recipe: req.params.id });
  }
};
