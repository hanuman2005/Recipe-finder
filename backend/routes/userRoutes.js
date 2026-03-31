const express = require("express");
const {
  getUserProfile,
  updateProfile,
  getFavorites,
  addFavorite,
  removeFavorite,
  getUserRecipes,
  getUsers,
  searchUsers,
  deleteAccount,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const {
  createDeleteLimiter,
  searchLimiter,
} = require("../middleware/rateLimitMiddleware");
const {
  validateUserInput,
  validateMongoIdParams,
} = require("../middleware/validationMiddleware");

const router = express.Router();

// Get current user profile (Protected)
router.get("/me", protect, getUserProfile);

// Update current user profile (Protected)
router.put(
  "/me",
  protect,
  createDeleteLimiter,
  validateUserInput,
  updateProfile,
);

// Get all users (Public)
router.get("/", getUsers);

// Search users (Public)
router.get("/search", searchLimiter, searchUsers);

// Get specific user profile (Public)
router.get("/:id", validateMongoIdParams(["id"]), getUserProfile);

// Get user's favorites (Protected)
router.get("/:id/favorites", validateMongoIdParams(["id"]), getFavorites);

// Get user's recipes (Public)
router.get("/:id/recipes", validateMongoIdParams(["id"]), getUserRecipes);

// Add favorite (Protected)
router.post(
  "/favorites/:recipeId",
  protect,
  createDeleteLimiter,
  validateMongoIdParams(["recipeId"]),
  addFavorite,
);

// Remove favorite (Protected)
router.delete(
  "/favorites/:recipeId",
  protect,
  createDeleteLimiter,
  validateMongoIdParams(["recipeId"]),
  removeFavorite,
);

// Delete account (Protected)
router.delete("/account", protect, createDeleteLimiter, deleteAccount);

module.exports = router;
