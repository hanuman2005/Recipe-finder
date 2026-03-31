/**
 * Comment Controller
 * Handles HTTP requests for comment and rating operations
 */

const commentService = require("../services/commentService");
const { queueEmail } = require("../jobs/emailProcessor");
const Recipe = require("../models/Recipe");
const {
  sendError,
  sendSuccess,
  sendPaginated,
} = require("../utils/responseHandler");

/**
 * GET /api/comments/recipe/:recipeId
 */
exports.getCommentsByRecipe = async (req, res) => {
  try {
    const recipeId = req.params.recipeId;
    const { page, limit } = req.query;

    const result = await commentService.getCommentsByRecipe(
      recipeId,
      page,
      limit,
    );

    sendPaginated(
      res,
      200,
      "Comments retrieved successfully",
      result.data,
      result.pagination,
    );
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "RECIPE_NOT_FOUND" : "COMMENTS_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, {
      recipeId: req.params.recipeId,
    });
  }
};

/**
 * GET /api/comments/:id
 */
exports.getCommentById = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await commentService.getCommentById(commentId);

    sendSuccess(res, 200, "Comment retrieved successfully", comment);
  } catch (error) {
    sendError(res, 404, "COMMENT_NOT_FOUND", error.message, {
      id: req.params.id,
    });
  }
};

/**
 * POST /api/comments
 * Protected route
 */
exports.createComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipeId, text, rating } = req.body;

    const comment = await commentService.createComment({
      recipeId,
      userId,
      text,
      rating,
    });

    // Queue notification email to recipe owner (background job - doesn't block response)
    (async () => {
      try {
        const recipe = await Recipe.findById(recipeId).populate(
          "user",
          "email name",
        );
        if (recipe && recipe.user && recipe.user.email) {
          await queueEmail(recipe.user.email, "comment", {
            recipeTitle: recipe.title,
            commenterName: comment.username,
          });
        }
      } catch (err) {
        console.error(
          "Failed to queue comment notification email:",
          err.message,
        );
      }
    })();

    sendSuccess(res, 201, "Comment posted successfully", comment);
  } catch (error) {
    sendError(res, 400, "COMMENT_CREATE_FAILED", error.message, { recipeId });
  }
};

/**
 * PUT /api/comments/:id
 * Protected route
 */
exports.updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    const { text, rating } = req.body;

    const comment = await commentService.updateComment(commentId, userId, {
      text,
      rating,
    });

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DELETE /api/comments/:id
 * Protected route
 */
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    const result = await commentService.deleteComment(commentId, userId);

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
 * GET /api/comments/user/:userId
 */
exports.getCommentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page, limit } = req.query;

    const result = await commentService.getCommentsByUser(userId, page, limit);

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
 * GET /api/comments/recipe/:recipeId/ratings
 */
exports.getRecipeRatings = async (req, res) => {
  try {
    const recipeId = req.params.recipeId;

    const ratings = await commentService.getRecipeRatings(recipeId);

    res.status(200).json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};
