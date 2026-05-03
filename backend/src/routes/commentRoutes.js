// ========== COMMENT ROUTES - API ENDPOINT DEFINITIONS ==========
// Defines all HTTP routes for comment and rating operations
// Includes: get comments by recipe/user, create, update, delete, get ratings
// Each route specifies: HTTP method, path, middleware chain, and controller handler

// Import Express router
const express = require("express");

// ========== IMPORT CONTROLLER HANDLERS ==========
// HTTP handler functions from commentController
const {
  getCommentsByRecipe, // GET - get all comments on recipe with pagination
  getCommentById, // GET - get single comment by ID
  createComment, // POST - create new comment
  updateComment, // PUT - update existing comment
  deleteComment, // DELETE - delete comment
  getCommentsByUser, // GET - get all comments by user with pagination
  getRecipeRatings, // GET - get aggregate ratings for recipe
} = require("../controllers/commentController");

// ========== IMPORT MIDDLEWARE ==========

// Authentication middleware - checks JWT token and sets req.user
const { protect } = require("../middleware/authMiddleware");

// Rate limiting middleware - prevents abuse
const { createDeleteLimiter } = require("../middleware/rateLimitMiddleware"); // Rate limiter: 30 req/15min per user

// Validation middleware - validates request data with Zod schemas
const {
  validate, // Validates request body
  validateParams, // Validates URL parameters
} = require("../middleware/validationMiddleware");

// ========== IMPORT VALIDATION SCHEMAS ==========
// Zod schemas that define valid request data structure

const {
  createCommentSchema, // Schema for POST / (create comment)
  updateCommentSchema, // Schema for PUT /:id (update comment)
} = require("../validations/commentValidation");

// Import Zod library for creating validation schemas
const { z } = require("zod");

const router = express.Router();

// ========== VALIDATION SCHEMAS DEFINITION ==========

/**
 * Comment ID validation schema
 * Validates MongoDB ID format (24-character hexadecimal string)
 * Used for: req.params.id validation
 */
const mongoIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format"),
});

/**
 * Recipe ID validation schema
 * Validates MongoDB ID format (24-character hexadecimal string)
 * Used for: req.params.recipeId validation
 */
const recipeIdSchema = z.object({
  recipeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid recipe ID format"),
});

/**
 * User ID validation schema
 * Validates MongoDB ID format (24-character hexadecimal string)
 * Used for: req.params.userId validation
 */
const userIdSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
});

// ========== GET OPERATIONS (SPECIFIC ROUTES FIRST) ==========
// These routes match specific patterns before more general ones

/**
 * ROUTE: GET /api/comments/recipe/:recipeId
 * Get all comments for specific recipe with pagination
 * Comments ordered by newest first
 * Middleware chain: validateParams → getCommentsByRecipe handler
 *
 * @param {String} recipeId - Recipe MongoDB ID (required)
 * @query {Number} page - Page number (optional, default: 1)
 * @query {Number} limit - Results per page (optional, default: 10)
 * @returns {200} Paginated array of comments with pagination metadata
 * @returns {404} If recipe not found
 */
router.get(
  "/recipe/:recipeId", // Path with parameter (specific - must come before /:id)
  validateParams(recipeIdSchema), // Validate recipeId format
  getCommentsByRecipe, // Handler
);

/**
 * ROUTE: GET /api/comments/recipe/:recipeId/ratings
 * Get aggregate ratings statistics for recipe
 * Calculates: average rating, total counts, distribution by star level
 * Middleware chain: validateParams → getRecipeRatings handler
 *
 * @param {String} recipeId - Recipe MongoDB ID (required)
 * @returns {200} Rating stats {average, count, distribution}
 * @returns {404} If recipe not found
 */
router.get(
  "/recipe/:recipeId/ratings", // Custom action on recipe route (specific - must come before /:id)
  validateParams(recipeIdSchema), // Validate recipeId format
  getRecipeRatings, // Handler
);

/**
 * ROUTE: GET /api/comments/:id
 * Get single comment by ID with full details
 * Includes commenter info and edit history
 * Middleware chain: validateParams → getCommentById handler
 *
 * @param {String} id - Comment MongoDB ID (required)
 * @returns {200} Comment object with commenter details
 * @returns {404} If comment not found
 */
router.get(
  "/:id", // Path with parameter (general - matches any /123)
  validateParams(mongoIdSchema), // Validate comment ID format
  getCommentById, // Handler
);

/**
 * ROUTE: GET /api/comments/user/:userId
 * Get all comments created by specific user with pagination
 * Includes all comments with their recipes
 * Middleware chain: validateParams → getCommentsByUser handler
 *
 * @param {String} userId - User MongoDB ID (required)
 * @query {Number} page - Page number (optional, default: 1)
 * @query {Number} limit - Results per page (optional, default: 10)
 * @returns {200} Paginated array of user's comments with pagination metadata
 * @returns {404} If user not found
 */
router.get(
  "/user/:userId", // Path with parameter (specific - must come before /:id)
  validateParams(userIdSchema), // Validate userId format
  getCommentsByUser, // Handler
);

// ========== CREATE OPERATION (POST) ==========

/**
 * ROUTE: POST /api/comments
 * Create new comment on recipe with optional rating
 * Queues notification email to recipe owner
 * Middleware chain: protect → createDeleteLimiter → validate → createComment handler
 *
 * @requires Authentication (JWT token)
 * @body {String} recipeId - Which recipe to comment on (required)
 * @body {String} text - Comment text (required, 1-1000 chars)
 * @body {Number} rating - Optional rating (1-5 stars)
 * @returns {201} Created Comment object
 * @returns {400} If validation fails
 */
router.post(
  "/", // Root path (will be /api/comments)
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validate(createCommentSchema), // Validate body data matches schema
  createComment, // Handler
);

// ========== UPDATE OPERATION (PUT) ==========

/**
 * ROUTE: PUT /api/comments/:id
 * Update existing comment
 * Only comment creator can update their own comments
 * Updates text and/or rating, tracks edit timestamp
 * Middleware chain: protect → createDeleteLimiter → validate → validateParams → updateComment handler
 *
 * @requires Authentication (JWT token)
 * @param {String} id - Comment MongoDB ID (required)
 * @body {String} text - Updated comment text (optional)
 * @body {Number} rating - Updated rating (optional, 1-5)
 * @returns {200} Updated Comment object
 * @returns {400} If authorization fails or validation fails
 * @returns {403} If user is not comment creator
 */
router.put(
  "/:id", // Path with parameter
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validate(updateCommentSchema), // Validate body data matches schema
  validateParams(mongoIdSchema), // Validate comment ID format
  updateComment, // Handler
);

// ========== DELETE OPERATION ==========

/**
 * ROUTE: DELETE /api/comments/:id
 * Delete comment permanently
 * Only comment creator can delete their own comments
 * Middleware chain: protect → createDeleteLimiter → validateParams → deleteComment handler
 *
 * @requires Authentication (JWT token)
 * @param {String} id - Comment MongoDB ID (required)
 * @returns {200} Success message
 * @returns {400} If not authorized or other error
 * @returns {404} If comment not found
 */
router.delete(
  "/:id", // Path with parameter
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validateParams(mongoIdSchema), // Validate comment ID format
  deleteComment, // Handler
);

// ========== EXPORT ROUTER ==========
// Export this router to be mounted in main app.js
// Usage in app.js: app.use('/api/comments', require('./routes/commentRoutes'))
module.exports = router;
