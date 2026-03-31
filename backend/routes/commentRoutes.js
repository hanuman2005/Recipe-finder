const express = require("express");
const {
  getCommentsByRecipe,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  getCommentsByUser,
  getRecipeRatings,
} = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");
const { createDeleteLimiter } = require("../middleware/rateLimitMiddleware");
const {
  validateUserInput,
  validateMongoIdParams,
} = require("../middleware/validationMiddleware");

const router = express.Router();

// Get all comments for a recipe (Public)
router.get("/recipe/:recipeId", getCommentsByRecipe);

// Get recipe ratings (Public)
router.get("/recipe/:recipeId/ratings", getRecipeRatings);

// Get specific comment (Public)
router.get("/:id", getCommentById);

// Get comments by user (Public)
router.get("/user/:userId", getCommentsByUser);

// Create comment (Protected)
router.post(
  "/",
  protect,
  createDeleteLimiter,
  validateUserInput,
  createComment,
);

// Update comment (Protected)
router.put(
  "/:id",
  protect,
  createDeleteLimiter,
  validateUserInput,
  validateMongoIdParams(["id"]),
  updateComment,
);

// Delete comment (Protected)
router.delete(
  "/:id",
  protect,
  createDeleteLimiter,
  validateMongoIdParams(["id"]),
  deleteComment,
);

module.exports = router;
