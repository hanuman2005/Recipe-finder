// ========== USER ROUTES - API ENDPOINT DEFINITIONS ==========
// Defines all HTTP routes for user operations
// Includes: profile management, favorites, recipes, account deletion, search
// Each route specifies: HTTP method, path, middleware chain, and controller handler

// Import Express router
const express = require("express");

// ========== IMPORT CONTROLLER HANDLERS ==========
// HTTP handler functions from userController
const {
  getUserProfile, // GET - get user profile info
  updateProfile, // PUT - update authenticated user's profile
  getFavorites, // GET - get user's favorite recipes
  addFavorite, // POST - add recipe to favorites
  removeFavorite, // DELETE - remove recipe from favorites
  getUserRecipes, // GET - get user's created recipes
  getUsers, // GET - list all users (admin)
  searchUsers, // GET - search users by name/email
  deleteAccount, // DELETE - delete user account
} = require("../controllers/userController");

// ========== IMPORT MIDDLEWARE ==========

// Authentication middleware - checks JWT token and sets req.user
const { protect } = require("../middleware/authMiddleware");

// Rate limiting middleware - prevents abuse
const {
  createDeleteLimiter, // Rate limiter: 30 req/15min per user
  searchLimiter, // Rate limiter: 60 req/60sec per user
} = require("../middleware/rateLimitMiddleware");

// Validation middleware - validates request data with Zod schemas
const {
  validate, // Validates request body
  validateParams, // Validates URL parameters
} = require("../middleware/validationMiddleware");

// ========== IMPORT VALIDATION SCHEMAS ==========
// Zod schemas that define valid request data structure

const { userUpdateSchema } = require("../validations/userValidation");

// Import Zod library for creating validation schemas
const { z } = require("zod");

const router = express.Router();

// ========== VALIDATION SCHEMAS DEFINITION ==========

/**
 * Mongo ID validation schema
 * Validates MongoDB ID format (24-character hexadecimal string)
 * Used for: req.params.id and req.params.recipeId validation
 */
const mongoIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format"),
});

// ========== PROFILE ROUTES ==========
// Operations for user profile management

/**
 * ROUTE: GET /api/users/me
 * Get authenticated user's own profile with statistics
 * Middleware chain: protect → getUserProfile handler
 *
 * @requires Authentication (JWT token)
 * @returns {200} User profile with stats (recipes count, favorites count, joined date)
 */
router.get(
  "/me", // Special path - authenticated user's own profile
  protect, // Authentication required
  getUserProfile, // Handler
);

/**
 * ROUTE: PUT /api/users/me
 * Update authenticated user's profile
 * Allowed fields: name, bio, profilePicture, location
 * Protected fields (cannot change): email, password, role
 * Middleware chain: protect → createDeleteLimiter → validate → updateProfile handler
 *
 * @requires Authentication (JWT token)
 * @body {Object} - Profile fields to update (validated by userUpdateSchema)
 * @returns {200} Updated user profile
 */
router.put(
  "/me", // Special path - authenticated user's own profile
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validate(userUpdateSchema), // Validate body data matches schema
  updateProfile, // Handler
);

// ========== LISTING & SEARCH ROUTES ==========
// Operations for viewing users

/**
 * ROUTE: GET /api/users
 * Get all users list with pagination (admin endpoint)
 * Middleware chain: getUsers handler
 *
 * @query {Number} page - Page number (optional, default: 1)
 * @query {Number} limit - Results per page (optional, default: 10)
 * @returns {200} Paginated array of users with pagination metadata
 */
router.get(
  "/", // Root path
  getUsers, // Handler
);

/**
 * ROUTE: GET /api/users/search
 * Search users by name or email (case-insensitive)
 * Middleware chain: searchLimiter → searchUsers handler
 *
 * @query {String} query - Search term (required)
 * @returns {200} Array of up to 10 matching users
 */
router.get(
  "/search", // Search endpoint (must come before :id to match first)
  searchLimiter, // Rate limiting: 60 req/60sec per IP
  searchUsers, // Handler
);

/**
 * ROUTE: GET /api/users/:id
 * Get specific user's public profile
 * Middleware chain: validateParams → getUserProfile handler
 *
 * @param {String} id - User MongoDB ID (required, must be valid MongoDB ID)
 * @returns {200} User profile with stats
 * @returns {404} If user not found
 */
router.get(
  "/:id", // Path with parameter
  validateParams(mongoIdSchema), // Validate ID format
  getUserProfile, // Handler
);

// ========== FAVORITES MANAGEMENT ROUTES ==========
// Operations for managing user's favorite recipes

/**
 * ROUTE: GET /api/users/:id/favorites
 * Get specific user's favorite recipes
 * Middleware chain: validateParams → getFavorites handler
 *
 * @param {String} id - User MongoDB ID
 * @returns {200} Array of favorite Recipe objects
 * @returns {404} If user not found
 */
router.get(
  "/:id/favorites", // Path with parameters
  validateParams(mongoIdSchema), // Validate ID format
  getFavorites, // Handler
);

/**
 * ROUTE: GET /api/users/:id/recipes
 * Get specific user's created recipes with pagination
 * Middleware chain: validateParams → getUserRecipes handler
 *
 * @param {String} id - User MongoDB ID
 * @query {Number} page - Page number (optional, default: 1)
 * @query {Number} limit - Results per page (optional, default: 10)
 * @returns {200} Paginated array of user's recipes with pagination metadata
 * @returns {404} If user not found
 */
router.get(
  "/:id/recipes", // Path with parameters
  validateParams(mongoIdSchema), // Validate ID format
  getUserRecipes, // Handler
);

/**
 * ROUTE: POST /api/users/favorites/:recipeId
 * Add recipe to authenticated user's favorites
 * Middleware chain: protect → createDeleteLimiter → validateParams → addFavorite handler
 *
 * @requires Authentication (JWT token)
 * @param {String} recipeId - Recipe MongoDB ID
 * @returns {200} Success message
 * @returns {409} If recipe already in favorites
 * @returns {404} If recipe or user not found
 */
router.post(
  "/favorites/:recipeId", // Path with parameter
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validateParams(z.object({ recipeId: z.string().regex(/^[a-f\d]{24}$/i) })), // Validate ID format
  addFavorite, // Handler
);

/**
 * ROUTE: DELETE /api/users/favorites/:recipeId
 * Remove recipe from authenticated user's favorites
 * Middleware chain: protect → createDeleteLimiter → validateParams → removeFavorite handler
 *
 * @requires Authentication (JWT token)
 * @param {String} recipeId - Recipe MongoDB ID
 * @returns {200} Success message
 * @returns {400} If recipe not in favorites
 * @returns {404} If user not found
 */
router.delete(
  "/favorites/:recipeId", // Path with parameter
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validateParams(z.object({ recipeId: z.string().regex(/^[a-f\d]{24}$/i) })), // Validate ID format
  removeFavorite, // Handler
);

// ========== ACCOUNT MANAGEMENT ROUTES ==========
// Operations for managing user account

/**
 * ROUTE: DELETE /api/users/account
 * Delete authenticated user's account permanently
 * Deletes user document and all associated recipes
 * WARNING: Cannot be undone
 * Middleware chain: protect → createDeleteLimiter → deleteAccount handler
 *
 * @requires Authentication (JWT token)
 * @returns {200} Success message
 * @returns {404} If user not found
 */
router.delete(
  "/account", // Delete account endpoint
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  deleteAccount, // Handler
);

// ========== EXPORT ROUTER ==========
// Export this router to be mounted in main app.js
// Usage in app.js: app.use('/api/users', require('./routes/userRoutes'))
module.exports = router;
