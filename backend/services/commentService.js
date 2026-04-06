// ========== COMMENT SERVICE ==========
// Handles all comment operations: create, read, update, delete, ratings
// Services contain business logic separate from route handlers

// Import data models
const Comment = require("../models/Comment"); // Comment model for database operations
const Recipe = require("../models/Recipe"); // Recipe model to validate recipe exists
const User = require("../models/User"); // User model to validate user exists
const AppError = require("../utils/AppError"); // Custom error class for consistent error handling

// ========== COMMENT SERVICE CLASS ==========
// Organizes comment-related methods in a single class
class CommentService {
  /**
   * METHOD: Get all comments for a specific recipe with pagination
   * @param {ObjectId} recipeId - ID of the recipe
   * @param {Number} page - Page number (default: 1)
   * @param {Number} limit - Comments per page (default: 10)
   * @returns {Object} Comments array + pagination info
   */
  async getCommentsByRecipe(recipeId, page = 1, limit = 10) {
    // ========== VALIDATION: Check recipe exists ==========
    // Query database for the recipe
    const recipe = await Recipe.findById(recipeId);
    // If recipe doesn't exist, throw error
    if (!recipe) {
      // AppError.notFound creates a 404 error with code RECIPE_NOT_FOUND
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId, // Include recipeId in error details
      });
    }

    // ========== CALCULATE PAGINATION OFFSET ==========
    // Skip = how many documents to skip before getting results
    // Example: page 2, limit 10 → skip (2-1)*10 = 10 documents
    const skip = (page - 1) * limit;

    // ========== FETCH COMMENTS + COUNT TOTAL ==========
    // Use Promise.all to run both queries in parallel for efficiency
    const [comments, total] = await Promise.all([
      // Query 1: Find comments for this recipe
      Comment.find({ recipeId: recipeId })
        .populate("userId", "name email") // Join User collection, get name & email only
        .skip(skip) // Skip documents for pagination
        .limit(limit) // Limit to X documents per page
        .sort({ createdAt: -1 }), // Sort by newest first (-1 = descending)

      // Query 2: Count total comments for this recipe (for pagination info)
      Comment.countDocuments({ recipeId: recipeId }),
    ]);

    // ========== RETURN FORMATTED RESPONSE ==========
    return {
      data: comments, // Array of comment documents
      pagination: {
        total, // Total comments in database for this recipe
        page, // Current page number
        limit, // Comments per page
        pages: Math.ceil(total / limit), // Total pages needed for all comments
      },
    };
  }

  /**
   * METHOD: Get a single comment by ID with full details
   * @param {ObjectId} commentId - ID of comment to fetch
   * @returns {Object} Comment document with populated user & recipe data
   */
  async getCommentById(commentId) {
    // Query for comment and populate related data
    const comment = await Comment.findById(commentId)
      .populate("userId", "name email") // Join User: get name & email
      .populate("recipeId", "title"); // Join Recipe: get title

    // If comment not found, throw 404 error
    if (!comment) {
      throw AppError.notFound("Comment not found", "COMMENT_NOT_FOUND", {
        commentId,
      });
    }

    // Return the fully populated comment
    return comment;
  }

  /**
   * METHOD: Create a new comment
   * @param {Object} commentData - {recipeId, userId, text, rating}
   * @returns {Object} The newly created comment
   */
  async createComment({ recipeId, userId, text, rating = null }) {
    // ========== VALIDATION: Check comment text ==========
    // Text is required and must have content (can't be just whitespace)
    if (!text || text.trim().length === 0) {
      throw AppError.badRequest("Comment cannot be empty", "EMPTY_COMMENT", {
        minLength: 1,
      });
    }

    // ========== VALIDATION: Max comment length ==========
    // Prevent spam/extremely long comments
    if (text.length > 1000) {
      throw AppError.badRequest(
        "Comment cannot exceed 1000 characters",
        "COMMENT_TOO_LONG",
        { maxLength: 1000, provided: text.length },
      );
    }

    // ========== VALIDATION: Rating must be 1-5 ==========
    // Rating is optional, but if provided must be valid
    if (rating && (rating < 1 || rating > 5)) {
      throw AppError.badRequest(
        "Rating must be between 1 and 5",
        "INVALID_RATING",
        { min: 1, max: 5, provided: rating },
      );
    }

    // ========== CHECK RECIPE EXISTS ==========
    // Can't comment on non-existent recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    // ========== CHECK USER EXISTS ==========
    // Can't comment if user doesn't exist
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== CREATE NEW COMMENT ==========
    // Create comment document with provided data
    const comment = new Comment({
      recipeId: recipeId, // Link to recipe
      userId: userId, // Link to user who commented
      username: user.name, // Cache username for quick display (denormalization)
      text: text.trim(), // Remove extra whitespace from text
      rating: rating || null, // Store rating or null if not provided
      createdAt: new Date(), // Timestamp when created
      updatedAt: new Date(), // Timestamp when last updated
    });

    // ========== SAVE TO DATABASE ==========
    // Persist comment to MongoDB
    await comment.save();
    // Populate user details after saving
    await comment.populate("userId", "name email");

    // Return the saved comment
    return comment;
  }

  /**
   * METHOD: Update an existing comment
   * @param {ObjectId} commentId - ID of comment to update
   * @param {ObjectId} userId - ID of user making the update (must be comment author)
   * @param {Object} updateData - {text, rating} fields to update
   * @returns {Object} Updated comment
   */
  async updateComment(commentId, userId, { text, rating = null }) {
    // ========== FETCH COMMENT ==========
    // Get the comment first to check authorization
    const comment = await Comment.findById(commentId);
    // If comment doesn't exist, throw error
    if (!comment) {
      throw AppError.notFound("Comment not found", "COMMENT_NOT_FOUND", {
        commentId,
      });
    }

    // ========== AUTHORIZATION CHECK ==========
    // Only the comment author can edit their comment
    // Convert ObjectIds to strings for comparison
    if (comment.userId.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to update this comment", // Error message
        "FORBIDDEN_UPDATE", // Error code
        { commentId, userId }, // Error details
      );
    }

    // ========== VALIDATION: Comment text ==========
    // If updating text, validate it's not empty
    if (text && text.trim().length === 0) {
      throw AppError.badRequest("Comment cannot be empty", "EMPTY_COMMENT", {
        minLength: 1,
      });
    }

    // ========== VALIDATION: Text length ==========
    // Can't exceed 1000 characters
    if (text && text.length > 1000) {
      throw AppError.badRequest(
        "Comment cannot exceed 1000 characters",
        "COMMENT_TOO_LONG",
        { maxLength: 1000, provided: text.length },
      );
    }

    // ========== VALIDATION: Rating ==========
    // If updating rating, validate it's 1-5
    if (rating !== null && rating !== undefined) {
      // Only validate if rating is being changed (not null/undefined)
      if (rating < 1 || rating > 5) {
        throw AppError.badRequest(
          "Rating must be between 1 and 5",
          "INVALID_RATING",
          { min: 1, max: 5, provided: rating },
        );
      }
      // Update rating on comment object
      comment.rating = rating;
    }

    // ========== PERFORM UPDATE ==========
    // Update the fields
    if (text) comment.text = text.trim(); // Update text if provided
    comment.updatedAt = new Date(); // Update timestamp
    // Save changes to database
    await comment.save();
    // Populate user details for response
    await comment.populate("userId", "name email");

    // Return updated comment
    return comment;
  }

  /**
   * METHOD: Delete a comment
   * @param {ObjectId} commentId - ID of comment to delete
   * @param {ObjectId} userId - ID of user deleting (must be comment author)
   * @returns {Object} Success message
   */
  async deleteComment(commentId, userId) {
    // ========== FETCH COMMENT ==========
    // Get comment to check authorization
    const comment = await Comment.findById(commentId);
    // If doesn't exist, throw error
    if (!comment) {
      throw AppError.notFound("Comment not found", "COMMENT_NOT_FOUND", {
        commentId,
      });
    }

    // ========== AUTHORIZATION CHECK ==========
    // Only comment author can delete
    if (comment.userId.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to delete this comment",
        "FORBIDDEN_DELETE",
        { commentId, userId },
      );
    }

    // ========== DELETE FROM DATABASE ==========
    // Remove comment from MongoDB
    await Comment.findByIdAndDelete(commentId);

    // Return success message
    return { message: "Comment deleted successfully" };
  }

  /**
   * METHOD: Get all comments posted by a specific user
   * @param {ObjectId} userId - ID of user
   * @param {Number} page - Page number (default: 1)
   * @param {Number} limit - Comments per page (default: 10)
   * @returns {Object} User's comments + pagination
   */
  async getCommentsByUser(userId, page = 1, limit = 10) {
    // ========== VALIDATE USER EXISTS ==========
    // Check if user exists before querying comments
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== CALCULATE PAGINATION ==========
    // How many documents to skip
    const skip = (page - 1) * limit;

    // ========== FETCH COMMENTS + COUNT ==========
    // Run both queries in parallel
    const [comments, total] = await Promise.all([
      // Get comments by this user
      Comment.find({ userId: userId })
        .populate("recipeId", "title") // Join Recipe: get title
        .populate("userId", "name email") // Join User: get name & email
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // Newest first

      // Count total comments by this user
      Comment.countDocuments({ userId: userId }),
    ]);

    // ========== RETURN PAGINATED RESULTS ==========
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
   * METHOD: Get recipe rating statistics
   * @param {ObjectId} recipeId - ID of recipe
   * @returns {Object} Average rating, total ratings, breakdown by star
   */
  async getRecipeRatings(recipeId) {
    // ========== VALIDATE RECIPE EXISTS ==========
    // Check recipe before querying comments
    const recipe = await Recipe.findById(recipeId).select("_id");
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    // ========== FETCH COMMENTS WITH RATINGS ==========
    // Get only comments that have a rating (not null/undefined)
    const comments = await Comment.find({
      recipeId: recipeId,
      rating: { $exists: true, $ne: null }, // MongoDB query: rating must exist and not be null
    });

    // ========== HANDLE NO RATINGS CASE ==========
    // If no one has rated, return zeroes
    if (comments.length === 0) {
      return {
        avgRating: 0,
        totalRatings: 0,
        ratingSummary: {},
      };
    }

    // ========== CALCULATE AVERAGE RATING ==========
    // Extract all ratings into array
    const ratings = comments.map((c) => c.rating);
    // Sum all ratings and divide by count, round to 1 decimal
    const avgRating = (
      ratings.reduce((a, b) => a + b) / ratings.length
    ).toFixed(1);

    // ========== COUNT RATINGS BY STAR ==========
    // Initialize counter for each star level 1-5
    const ratingSummary = {
      5: 0, // 5-star count
      4: 0, // 4-star count
      3: 0, // 3-star count
      2: 0, // 2-star count
      1: 0, // 1-star count
    };

    // Count how many ratings for each star level
    ratings.forEach((r) => {
      ratingSummary[r]++; // Increment count for this rating
    });

    // ========== RETURN RATING STATISTICS ==========
    return {
      avgRating: parseFloat(avgRating), // Convert back from string to number
      totalRatings: ratings.length, // How many people rated
      ratingSummary, // Breakdown by star (1-5)
    };
  }

  /**
   * METHOD: Check if a user has already commented on a recipe
   * @param {ObjectId} recipeId - ID of recipe
   * @param {ObjectId} userId - ID of user
   * @returns {Boolean} True if user commented, false otherwise
   */
  async hasCommented(recipeId, userId) {
    // ========== QUERY FOR EXISTING COMMENT ==========
    // Check if any comment exists with this recipe + user combo
    const comment = await Comment.findOne({
      recipeId: recipeId,
      userId: userId,
    });

    // ========== RETURN BOOLEAN ==========
    // !!comment converts to boolean (true if found, false if null)
    return !!comment;
  }
}

// ========== EXPORT SERVICE ==========
// Create single instance of CommentService and export it
// This ensures same instance used across entire app (singleton pattern)
module.exports = new CommentService();
