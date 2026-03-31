/**
 * User Controller
 * Handles HTTP requests for user operations
 */

const userService = require("../services/userService");
const { sendError, sendSuccess } = require("../utils/responseHandler");

/**
 * GET /api/users/:id
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await userService.getUserProfile(userId);

    sendSuccess(res, 200, "User profile retrieved", user);
  } catch (error) {
    sendError(res, 404, "USER_NOT_FOUND", error.message, {
      userId: req.params.id,
    });
  }
};

/**
 * PUT /api/users/profile
 * Protected route
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    const user = await userService.updateProfile(userId, updateData);

    sendSuccess(res, 200, "Profile updated successfully", user);
  } catch (error) {
    sendError(res, 400, "PROFILE_UPDATE_FAILED", error.message, {
      userId: req.user._id,
    });
  }
};

/**
 * GET /api/users/:id/favorites
 */
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    const favorites = await userService.getFavorites(userId);

    sendSuccess(res, 200, "Favorites retrieved", favorites);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "USER_NOT_FOUND" : "FAVORITES_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, { userId });
  }
};

/**
 * POST /api/users/favorites/:recipeId
 * Protected route
 */
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.recipeId;

    const result = await userService.addFavorite(userId, recipeId);

    sendSuccess(res, 200, result.message);
  } catch (error) {
    sendError(res, 400, "FAVORITE_ADD_FAILED", error.message, { recipeId });
  }
};

/**
 * DELETE /api/users/favorites/:recipeId
 * Protected route
 */
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.recipeId;

    const result = await userService.removeFavorite(userId, recipeId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id/recipes
 */
exports.getUserRecipes = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page, limit } = req.query;

    const result = await userService.getUserRecipes(userId, page, limit);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/users
 */
exports.getUsers = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await userService.getUsers(page, limit);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error.message.includes("required") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/users/search?query=john
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    const users = await userService.searchUsers(query);

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DELETE /api/users/account
 * Protected route
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await userService.deleteAccount(userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};
