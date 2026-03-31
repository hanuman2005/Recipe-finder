const express = require("express");
const router = express.Router();
const {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  getRecipesByState,
  searchRecipes,
  getUserFavoriteRecipes,
  getUserRecipes,
  getRecipesByCategory,
  addToFavorites,
  removeFromFavorites,
} = require("../controllers/recipeController");
const { protect } = require("../middleware/authMiddleware");
const {
  createDeleteLimiter,
  searchLimiter,
} = require("../middleware/rateLimitMiddleware");
const {
  validateUserInput,
  validateMongoIdParams,
} = require("../middleware/validationMiddleware");

// Specific routes (before wildcard routes)
router.get("/search", searchLimiter, searchRecipes); // Search recipes by title
router.get("/favorites", protect, getUserFavoriteRecipes); // Get user's favorite recipes
router.get("/my-recipes", protect, getUserRecipes); // Get user's own recipes
router.post(
  "/:id/favorite",
  protect,
  createDeleteLimiter,
  validateMongoIdParams(["id"]),
  addToFavorites,
); // Add to favorites
router.delete(
  "/:id/favorite",
  protect,
  createDeleteLimiter,
  validateMongoIdParams(["id"]),
  removeFromFavorites,
); // Remove from favorites
router.get("/category/:category", getRecipesByCategory); // Get recipes by category
router.get("/state/:state", getRecipesByState); // Get recipes by state

// General CRUD routes
router.post("/", protect, createDeleteLimiter, validateUserInput, createRecipe); // Create a new recipe
router.get("/", getRecipes); // Get all recipes
router.get("/:id", validateMongoIdParams(["id"]), getRecipeById); // Get a recipe by ID
router.put(
  "/:id",
  protect,
  createDeleteLimiter,
  validateUserInput,
  validateMongoIdParams(["id"]),
  updateRecipe,
); // Update a recipe (auth required)
router.delete(
  "/:id",
  protect,
  createDeleteLimiter,
  validateMongoIdParams(["id"]),
  deleteRecipe,
); // Delete a recipe (auth required)

module.exports = router;
