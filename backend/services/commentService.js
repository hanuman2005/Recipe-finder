/**
 * Comment Service
 * Handles comment operations: create, update, delete, list
 */

const Comment = require("../models/Comment");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const AppError = require("../utils/AppError");

class CommentService {
  /**
   * Get all comments for a recipe
   */
  async getCommentsByRecipe(recipeId, page = 1, limit = 10) {
    // Validate recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ recipeId: recipeId })
        .populate("userId", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Comment.countDocuments({ recipeId: recipeId }),
    ]);

    return {
      data: comments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single comment
   */
  async getCommentById(commentId) {
    const comment = await Comment.findById(commentId)
      .populate("userId", "name email")
      .populate("recipeId", "title");

    if (!comment) {
      throw AppError.notFound("Comment not found", "COMMENT_NOT_FOUND", {
        commentId,
      });
    }

    return comment;
  }

  /**
   * Create comment
   */
  async createComment({ recipeId, userId, text, rating = null }) {
    // Validation
    if (!text || text.trim().length === 0) {
      throw AppError.badRequest("Comment cannot be empty", "EMPTY_COMMENT", {
        minLength: 1,
      });
    }

    if (text.length > 1000) {
      throw AppError.badRequest(
        "Comment cannot exceed 1000 characters",
        "COMMENT_TOO_LONG",
        { maxLength: 1000, provided: text.length },
      );
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      throw AppError.badRequest(
        "Rating must be between 1 and 5",
        "INVALID_RATING",
        { min: 1, max: 5, provided: rating },
      );
    }

    // Check if recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Create comment
    const comment = new Comment({
      recipeId: recipeId,
      userId: userId,
      username: user.name,
      text: text.trim(),
      rating: rating || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await comment.save();
    await comment.populate("userId", "name email");

    return comment;
  }

  /**
   * Update comment
   */
  async updateComment(commentId, userId, { text, rating = null }) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw AppError.notFound("Comment not found", "COMMENT_NOT_FOUND", {
        commentId,
      });
    }

    // Check authorization
    if (comment.userId.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to update this comment",
        "FORBIDDEN_UPDATE",
        { commentId, userId },
      );
    }

    // Validation
    if (text && text.trim().length === 0) {
      throw AppError.badRequest("Comment cannot be empty", "EMPTY_COMMENT", {
        minLength: 1,
      });
    }

    if (text && text.length > 1000) {
      throw AppError.badRequest(
        "Comment cannot exceed 1000 characters",
        "COMMENT_TOO_LONG",
        { maxLength: 1000, provided: text.length },
      );
    }

    // Validate rating
    if (rating !== null && rating !== undefined) {
      if (rating < 1 || rating > 5) {
        throw AppError.badRequest(
          "Rating must be between 1 and 5",
          "INVALID_RATING",
          { min: 1, max: 5, provided: rating },
        );
      }
      comment.rating = rating;
    }

    // Update
    if (text) comment.text = text.trim();
    comment.updatedAt = new Date();
    await comment.save();
    await comment.populate("userId", "name email");

    return comment;
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw AppError.notFound("Comment not found", "COMMENT_NOT_FOUND", {
        commentId,
      });
    }

    // Check authorization
    if (comment.userId.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to delete this comment",
        "FORBIDDEN_DELETE",
        { commentId, userId },
      );
    }

    await Comment.findByIdAndDelete(commentId);

    return { message: "Comment deleted successfully" };
  }

  /**
   * Get comments by user
   */
  async getCommentsByUser(userId, page = 1, limit = 10) {
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ userId: userId })
        .populate("recipeId", "title")
        .populate("userId", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Comment.countDocuments({ userId: userId }),
    ]);

    return {
      data: comments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get recipe ratings
   */
  async getRecipeRatings(recipeId) {
    const recipe = await Recipe.findById(recipeId).select("_id");
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    const comments = await Comment.find({
      recipeId: recipeId,
      rating: { $exists: true, $ne: null },
    });

    if (comments.length === 0) {
      return {
        avgRating: 0,
        totalRatings: 0,
        ratingSummary: {},
      };
    }

    const ratings = comments.map((c) => c.rating);
    const avgRating = (
      ratings.reduce((a, b) => a + b) / ratings.length
    ).toFixed(1);

    // Count ratings by star
    const ratingSummary = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratings.forEach((r) => {
      ratingSummary[r]++;
    });

    return {
      avgRating: parseFloat(avgRating),
      totalRatings: ratings.length,
      ratingSummary,
    };
  }

  /**
   * Check if user commented on recipe
   */
  async hasCommented(recipeId, userId) {
    const comment = await Comment.findOne({
      recipeId: recipeId,
      userId: userId,
    });

    return !!comment;
  }
}

module.exports = new CommentService();
