// ========== USER CONTROLLER - HTTP REQUEST HANDLERS ==========
// Handles all HTTP requests for user endpoints
// Responsibility: Parse request → Call service → Format response
// Does NOT contain business logic (that's in userService.js)

// Import business logic layer (service)
const userService = require("../services/userService");
// Import response formatting utilities
const { sendError, sendSuccess } = require("../utils/responseHandler");

// ========== PROFILE OPERATIONS ==========

/**
 * HANDLER: GET /api/users/:id
 * Get user profile with statistics
 * Includes: name, email, bio, favorites count, recipes count, joined date
 * @route GET /api/users/66f1a2b3c4d5e6f7g8h9i0j1
 * @param {String} req.params.id - User MongoDB ID
 * @returns {200} User profile with stats (recipes, favorites, joined date)
 * @returns {404} If user not found
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Extract user ID from URL parameter
    const userId = req.params.id;

    // Call service layer to fetch profile with stats
    const user = await userService.getUserProfile(userId);

    // Success response with user data
    sendSuccess(res, 200, "User profile retrieved", user);
  } catch (error) {
    // Error response: user not found (404)
    sendError(res, 404, "USER_NOT_FOUND", error.message, {
      userId: req.params.id,
    });
  }
};

/**
 * HANDLER: PUT /api/users/profile
 * Update authenticated user's profile
 * Allowed fields: name, bio, profilePicture, location
 * Protected fields (cannot change): email, password, role
 * @route PUT /api/users/profile
 * @requires Authentication (JWT token, req.user._id)
 * @body {String} name - Display name (optional)
 * @body {String} bio - Biography (optional)
 * @body {String} profilePicture - Profile photo URL (optional)
 * @body {String} location - Location (optional)
 * @returns {200} Updated User profile
 * @returns {400} If validation fails
 */
exports.updateProfile = async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user._id;
    // Extract update data from request body
    const updateData = req.body;

    // Call service layer with update data and user ID
    const user = await userService.updateProfile(userId, updateData);

    // Success response with updated user
    sendSuccess(res, 200, "Profile updated successfully", user);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "PROFILE_UPDATE_FAILED", error.message, {
      userId: req.user._id,
    });
  }
};

// ========== FAVORITES MANAGEMENT ==========

/**
 * HANDLER: GET /api/users/:id/favorites
 * Get user's favorite recipes
 * Returns full recipe objects with creator info
 * @route GET /api/users/66f1a2b3c4d5e6f7g8h9i0j1/favorites
 * @param {String} req.params.id - User MongoDB ID (optional if authenticated)
 * @returns {200} Array of favorite Recipe objects
 * @returns {404} If user not found
 */
exports.getFavorites = async (req, res) => {
  try {
    // Use provided user ID or authenticated user's ID
    // If authenticated, can get own favorites without specifying ID
    const userId = req.params.id || req.user._id;

    // Call service layer to fetch favorites
    const favorites = await userService.getFavorites(userId);

    // Success response with favorites array
    sendSuccess(res, 200, "Favorites retrieved", favorites);
  } catch (error) {
    // Determine status code: 404 if user not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "USER_NOT_FOUND" : "FAVORITES_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, { userId });
  }
};

/**
 * HANDLER: POST /api/users/favorites/:recipeId
 * Add recipe to authenticated user's favorites
 * @route POST /api/users/favorites/66f1a2b3c4d5e6f7g8h9i0j1
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.recipeId - Recipe MongoDB ID to favorite
 * @returns {200} Success message
 * @returns {400} If recipe already favorited or other error
 * @returns {404} If recipe not found
 */
exports.addFavorite = async (req, res) => {
  try {
    // Get authenticated user's ID
    const userId = req.user._id;
    // Extract recipe ID from URL parameter
    const recipeId = req.params.recipeId;

    // Call service layer to add to favorites
    const result = await userService.addFavorite(userId, recipeId);

    // Success response with message
    sendSuccess(res, 200, result.message);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "FAVORITE_ADD_FAILED", error.message, { recipeId });
  }
};

/**
 * HANDLER: DELETE /api/users/favorites/:recipeId
 * Remove recipe from authenticated user's favorites
 * @route DELETE /api/users/favorites/66f1a2b3c4d5e6f7g8h9i0j1
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.recipeId - Recipe MongoDB ID to remove
 * @returns {200} Success message
 * @returns {400} If recipe not in favorites or other error
 * @returns {404} If user not found
 */
exports.removeFavorite = async (req, res) => {
  try {
    // Get authenticated user's ID
    const userId = req.user._id;
    // Extract recipe ID from URL parameter
    const recipeId = req.params.recipeId;

    // Call service layer to remove from favorites
    const result = await userService.removeFavorite(userId, recipeId);

    // Success response with message
    sendSuccess(res, 200, result.message);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "FAVORITE_REMOVE_FAILED", error.message, { recipeId });
  }
};

// ========== RECIPES MANAGEMENT ==========

/**
 * HANDLER: GET /api/users/:id/recipes
 * Get all recipes created by specific user with pagination
 * @route GET /api/users/66f1a2b3c4d5e6f7g8h9i0j1/recipes?page=1&limit=10
 * @param {String} req.params.id - User MongoDB ID
 * @query {Number} page - Page number (default: 1)
 * @query {Number} limit - Results per page (default: 10)
 * @returns {200} Paginated array of Recipe objects with pagination info
 * @returns {404} If user not found
 */
exports.getUserRecipes = async (req, res) => {
  try {
    // Extract user ID from URL parameter
    const userId = req.params.id;
    // Extract pagination params from query string
    const { page, limit } = req.query;

    // Call service layer to fetch paginated recipes
    const result = await userService.getUserRecipes(userId, page, limit);

    // Import pagination response builder
    const { sendPaginated } = require("../utils/responseHandler");
    // Send paginated response with data and pagination metadata
    sendPaginated(
      res,
      200,
      "User recipes retrieved",
      result.data || result.recipes, // Data array
      result.pagination, // Pagination info {total, page, pages, hasNext, hasPrev}
    );
  } catch (error) {
    // Determine status code: 404 if user not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "USER_NOT_FOUND" : "USER_RECIPES_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, { userId });
  }
};

// ========== USER LISTING & SEARCH (ADMIN) ==========

/**
 * HANDLER: GET /api/users
 * Get all users list with pagination (admin only)
 * @route GET /api/users?page=1&limit=10
 * @requires Admin privileges (typically checked in route middleware)
 * @query {Number} page - Page number (default: 1)
 * @query {Number} limit - Results per page (default: 10)
 * @returns {200} Paginated array of User objects with pagination info
 * @returns {400} If pagination params invalid
 * @returns {500} If database error
 */
exports.getUsers = async (req, res) => {
  try {
    // Extract pagination params from query string
    const { page, limit } = req.query;

    // Call service layer to fetch paginated users list
    const result = await userService.getUsers(page, limit);

    // Import pagination response builder
    const { sendPaginated } = require("../utils/responseHandler");
    // Send paginated response with data and pagination metadata
    sendPaginated(
      res,
      200,
      "Users retrieved",
      result.data || result.users, // Data array
      result.pagination, // Pagination info {total, page, pages}
    );
  } catch (error) {
    // Determine status code: 400 if invalid params, 500 otherwise
    const statusCode = error.message.includes("required") ? 400 : 500;
    sendError(res, statusCode, "USERS_FETCH_FAILED", error.message);
  }
};

/**
 * HANDLER: GET /api/users/search
 * Search users by name or email (case-insensitive)
 * Returns up to 10 matching users
 * @route GET /api/users/search?query=john
 * @query {String} query - Search term (required)
 * @returns {200} Array of up to 10 matching User objects
 * @returns {400} If search query missing
 */
exports.searchUsers = async (req, res) => {
  try {
    // Extract search query from query parameters
    const { query } = req.query;

    // Call service layer to search users
    const users = await userService.searchUsers(query);

    // Success response with users array and count
    sendSuccess(res, 200, "Users found", { users, count: users.length });
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "USERS_SEARCH_FAILED", error.message, { query });
  }
};

// ========== ACCOUNT MANAGEMENT ==========

/**
 * HANDLER: DELETE /api/users/account
 * Delete authenticated user's account permanently
 * Also deletes all recipes created by user
 * WARNING: This cannot be undone
 * @route DELETE /api/users/account
 * @requires Authentication (JWT token, req.user._id)
 * @returns {200} Success message
 * @returns {404} If user not found
 */
exports.deleteAccount = async (req, res) => {
  try {
    // Get authenticated user's ID
    const userId = req.user._id;

    // Call service layer to delete account and associated data
    const result = await userService.deleteAccount(userId);

    // Success response with message
    sendSuccess(res, 200, result.message);
  } catch (error) {
    // Determine status code: 404 if user not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    sendError(res, statusCode, "DELETE_ACCOUNT_FAILED", error.message, {
      userId,
    });
  }
};
