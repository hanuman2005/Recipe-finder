// ========== RECIPE ROUTES - API ENDPOINT DEFINITIONS ==========
// Defines all HTTP routes for recipe operations
// Each route specifies: HTTP method, path, middleware chain, and controller handler
// Middleware order: auth → rate limiting → validation → controller

// Import Express router
const express = require("express");
const router = express.Router();

// ========== IMPORT CONTROLLER HANDLERS ==========
// HTTP handler functions from recipeController
const {
  createRecipe, // POST - create new recipe
  getRecipes, // GET - get all recipes with filters
  getRecipeById, // GET - get single recipe
  updateRecipe, // PUT - update recipe
  deleteRecipe, // DELETE - remove recipe
  getRecipesByState, // GET - get recipes by state
  searchRecipes, // GET - search recipes by text
  smartSearch, // GET - TASK 2: Smart search with weighted relevance scoring
  getUserFavoriteRecipes, // GET - get user's favorite recipes
  getUserRecipes, // GET - get user's created recipes
  getRecipesByCategory, // GET - get recipes by category
  addToFavorites, // POST - add to favorites
  removeFromFavorites, // DELETE - remove from favorites
} = require("../controllers/recipeController");

// ========== IMPORT MIDDLEWARE ==========

// Authentication middleware - checks JWT token and sets req.user
const { protect } = require("../middleware/authMiddleware");

// Rate limiting middleware - prevents abuse
const {
  createDeleteLimiter, // Rate limiter for create/delete: 30 req/15min
  searchLimiter, // Rate limiter for search: 60 req/60sec
} = require("../middleware/rateLimitMiddleware");

// Validation middleware - validates request data with Zod schemas
const {
  validate, // Validates request body
  validateQuery, // Validates query parameters
  validateParams, // Validates URL parameters
} = require("../middleware/validationMiddleware");

// ========== IMPORT VALIDATION SCHEMAS ==========
// Zod schemas that define valid request data structure

const {
  createRecipeSchema, // Schema for POST /recipes (create)
  updateRecipeSchema, // Schema for PUT /recipes/:id (update)
  recipeFilterSchema, // Schema for GET /recipes query params (filters)
} = require("../validations/recipeValidation");

// Import Zod library for creating validation schemas
const { z } = require("zod");

// ========== VALIDATION SCHEMAS DEFINITION ==========

/**
 * Mongo ID validation schema
 * Validates MongoDB ID format (24-character hexadecimal string)
 * Used for: req.params.id validation in all :id routes
 */
const mongoIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format"),
});

// ========== SPECIFIC ROUTES (Order matters: specific before general) ==========
// These routes must come BEFORE wildcard routes to match first

/**
 * ROUTE: GET /api/recipes/search
 * Search recipes by text (title or description)
 * Middleware chain: searchLimiter → validateQuery → searchRecipes handler
 *
 * @query {String} title - Search term (required)
 * @returns {200} Array of matching recipes
 */
router.get(
  "/search", // Path (specific - must come before /:id)
  searchLimiter, // Rate limiting: 60 req/60sec per IP
  validateQuery(recipeFilterSchema), // Validate query params
  searchRecipes, // Handler
);

/**
 * ROUTE: GET /api/recipes/smart-search
 * TASK 2: Smart Search - MongoDB weighted text search with relevance scoring
 * Uses compound text index with weights: title (10x) > description (5x) > ingredients (3x)
 * Example: "Chicken masala" returns recipes with "Chicken" in title first
 * Performance: <100ms for typical queries due to weighted index
 * Middleware chain: searchLimiter → validateQuery → smartSearch handler
 *
 * @query {String} query - Search query (required)
 * @query {Number} page - Page number for pagination (default: 1)
 * @query {Number} limit - Results per page (default: 20, max: 100)
 * @returns {200} Array of recipes sorted by relevance score
 *
 * @example GET /api/recipes/smart-search?query=chicken&page=1&limit=20
 * @example GET /api/recipes/smart-search?query=easy breakfast masala
 */
router.get(
  "/smart-search", // Path (specific - must come before /:id)
  searchLimiter, // Rate limiting: 60 req/60sec per IP
  validateQuery(recipeFilterSchema), // Validate query params
  smartSearch, // Handler
);

/**
 * ROUTE: GET /api/recipes/favorites
 * Get authenticated user's favorite recipes
 * Middleware chain: protect → getUserFavoriteRecipes handler
 *
 * @requires Authentication (JWT token)
 * @returns {200} Array of favorite Recipe objects
 */
router.get(
  "/favorites", // Path (specific - must come before /:id)
  protect, // Authentication required
  getUserFavoriteRecipes, // Handler
);

/**
 * ROUTE: GET /api/recipes/my-recipes
 * Get authenticated user's created recipes
 * Middleware chain: protect → getUserRecipes handler
 *
 * @requires Authentication (JWT token)
 * @returns {200} Array of user's Recipe objects
 */
router.get(
  "/my-recipes", // Path (specific - must come before /:id)
  protect, // Authentication required
  getUserRecipes, // Handler
);

/**
 * ROUTE: POST /api/recipes/:id/favorite
 * Add recipe to user's favorites
 * Middleware chain: protect → createDeleteLimiter → validateParams → addToFavorites handler
 *
 * @requires Authentication (JWT token)
 * @param {String} id - Recipe MongoDB ID
 * @returns {200} Updated favorites array
 */
router.post(
  "/:id/favorite", // Custom action on :id route
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validateParams(mongoIdSchema), // Validate ID format
  addToFavorites, // Handler
);

/**
 * ROUTE: DELETE /api/recipes/:id/favorite
 * Remove recipe from user's favorites
 * Middleware chain: protect → createDeleteLimiter → validateParams → removeFromFavorites handler
 *
 * @requires Authentication (JWT token)
 * @param {String} id - Recipe MongoDB ID
 * @returns {200} Updated favorites array
 */
router.delete(
  "/:id/favorite", // Custom action on :id route
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validateParams(mongoIdSchema), // Validate ID format
  removeFromFavorites, // Handler
);

/**
 * ROUTE: GET /api/recipes/category/:category
 * Get all recipes from specific category
 * Middleware chain: getRecipesByCategory handler
 *
 * @param {String} category - Category name (e.g., "Italian", "Indian")
 * @returns {200} Array of recipes in that category
 */
router.get(
  "/category/:category", // Path with parameter
  getRecipesByCategory, // Handler
);

/**
 * ROUTE: GET /api/recipes/state/:state
 * Get all recipes from specific state/region
 * Middleware chain: getRecipesByState handler
 *
 * @param {String} state - State name (e.g., "Maharashtra", "Kerala")
 * @returns {200} Array of recipes from that state
 */
router.get(
  "/state/:state", // Path with parameter
  getRecipesByState, // Handler
);

// ========== GENERAL CRUD ROUTES (Order matters: specific before general) ==========
// These routes match by HTTP method and path

/**
 * ROUTE: POST /api/recipes
 * Create new recipe
 * Middleware chain: protect → createDeleteLimiter → validate → createRecipe handler
 *
 * @requires Authentication (JWT token)
 * @body {Object} - Recipe data (validated by createRecipeSchema)
 * @returns {201} Created Recipe object
 */
router.post(
  "/", // Root path (will be /api/recipes)
  protect, // Authentication required (user must be logged in)
  createDeleteLimiter, // Rate limiting: 30 req/15min per user (prevent spam)
  validate(createRecipeSchema), // Validate body data matches schema
  createRecipe, // Handler
);

/**
 * ROUTE: GET /api/recipes
 * Get all recipes with optional filtering and pagination
 * Middleware chain: validateQuery → getRecipes handler
 *
 * @query {String} category - Filter by category (optional)
 * @query {String} state - Filter by state (optional)
 * @query {String} search - Text search in title/description (optional)
 * @query {String} equipment - Equipment filter (POWER FEATURE #3, optional)
 * @query {Number} maxPrepTime - Max prep time in minutes (optional)
 * @query {Number} maxCookTime - Max cook time in minutes (optional)
 * @query {String} difficulty - Filter by difficulty (optional)
 * @query {Number} minRating - Filter by minimum rating (optional)
 * @query {Number} page - Page number (default: 1, optional)
 * @query {Number} limit - Results per page (default: 10, optional)
 * @returns {200} Paginated array of recipes with pagination metadata
 */
router.get(
  "/", // Root path (will be /api/recipes)
  validateQuery(recipeFilterSchema), // Validate query parameters
  getRecipes, // Handler
);

/**
 * ROUTE: GET /api/recipes/:id
 * Get single recipe by ID
 * Middleware chain: validateParams → getRecipeById handler
 *
 * @param {String} id - Recipe MongoDB ID (required, must be valid MongoDB ID)
 * @returns {200} Recipe object with full details
 * @returns {404} If recipe not found
 */
router.get(
  "/:id", // Path with parameter (will match /api/recipes/ABC123)
  validateParams(mongoIdSchema), // Validate ID format
  getRecipeById, // Handler
);

/**
 * ROUTE: PUT /api/recipes/:id
 * Update existing recipe (partial update allowed)
 * Only recipe creator can update
 * Middleware chain: protect → createDeleteLimiter → validate → validateParams → updateRecipe handler
 *
 * @requires Authentication (JWT token)
 * @param {String} id - Recipe MongoDB ID (required)
 * @body {Object} - Fields to update (validated by updateRecipeSchema)
 * @returns {200} Updated Recipe object
 * @returns {403} If user is not recipe creator
 * @returns {404} If recipe not found
 */
router.put(
  "/:id", // Path with parameter
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validate(updateRecipeSchema), // Validate body data matches schema
  validateParams(mongoIdSchema), // Validate ID format
  updateRecipe, // Handler
);

/**
 * ROUTE: DELETE /api/recipes/:id
 * Delete recipe permanently
 * Only recipe creator can delete
 * Middleware chain: protect → createDeleteLimiter → validateParams → deleteRecipe handler
 *
 * @requires Authentication (JWT token)
 * @param {String} id - Recipe MongoDB ID (required)
 * @returns {200} Success message
 * @returns {403} If user is not recipe creator
 * @returns {404} If recipe not found
 */
router.delete(
  "/:id", // Path with parameter
  protect, // Authentication required
  createDeleteLimiter, // Rate limiting: 30 req/15min per user
  validateParams(mongoIdSchema), // Validate ID format
  deleteRecipe, // Handler
);

// ========== EXPORT ROUTER ==========
// Export this router to be mounted in main app.js
// Usage in app.js: app.use('/api/recipes', require('./routes/recipeRoutes'))
module.exports = router;
