// ========== COMMENT CONTROLLER - HTTP REQUEST HANDLERS ==========
// Handles all HTTP requests for comment and rating endpoints
// Responsibility: Parse request → Call service → Format response
// Does NOT contain business logic (that's in commentService.js)

// Import business logic layer (service)
const commentService = require("../services/commentService");
// Import background job queues
const { queueEmail } = require("../jobs/emailProcessor"); // Email notification jobs
// Import database models
const Recipe = require("../models/Recipe"); // Recipe model for notification logic
// Import response formatting utilities
const {
  sendError,
  sendSuccess,
  sendPaginated,
} = require("../utils/responseHandler");

// ========== GET OPERATIONS / READ ==========

/**
 * HANDLER: GET /api/comments/recipe/:recipeId
 * Get all comments for specific recipe with pagination
 * Comments ordered by newest first, populated with commenter info
 * @route GET /api/comments/recipe/66f1a2b3c4d5e6f7g8h9i0j1?page=1&limit=10
 * @param {String} req.params.recipeId - Recipe MongoDB ID
 * @query {Number} page - Page number (default: 1)
 * @query {Number} limit - Results per page (default: 10)
 * @returns {200} Paginated array of Comment objects with pagination info
 * @returns {404} If recipe not found
 */
exports.getCommentsByRecipe = async (req, res) => {
  try {
    // Extract recipe ID from URL parameter
    const recipeId = req.params.recipeId;
    // Extract pagination params from query string
    const { page, limit } = req.query;

    // Call service layer to fetch paginated comments
    const result = await commentService.getCommentsByRecipe(
      recipeId,
      page,
      limit,
    );

    // Send paginated response with data and pagination metadata
    sendPaginated(
      res,
      200,
      "Comments retrieved successfully",
      result.data, // Array of comments
      result.pagination, // {total, page, pages}
    );
  } catch (error) {
    // Determine status code: 404 if recipe not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "RECIPE_NOT_FOUND" : "COMMENTS_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, {
      recipeId: req.params.recipeId,
    });
  }
};

/**
 * HANDLER: GET /api/comments/:id
 * Get single comment by ID with full details
 * Includes commenter info and edit history
 * @route GET /api/comments/66f1a2b3c4d5e6f7g8h9i0j1
 * @param {String} req.params.id - Comment MongoDB ID
 * @returns {200} Comment object with commenter details
 * @returns {404} If comment not found
 */
exports.getCommentById = async (req, res) => {
  try {
    // Extract comment ID from URL parameter
    const commentId = req.params.id;

    // Call service layer to fetch comment
    const comment = await commentService.getCommentById(commentId);

    // Success response with comment data
    sendSuccess(res, 200, "Comment retrieved successfully", comment);
  } catch (error) {
    // Error response: comment not found (404)
    sendError(res, 404, "COMMENT_NOT_FOUND", error.message, {
      id: req.params.id,
    });
  }
};

// ========== CREATE OPERATIONS / POST ==========

/**
 * HANDLER: POST /api/comments
 * Create new comment on recipe with optional rating
 * Queues notification email to recipe owner (background job)
 * @route POST /api/comments
 * @requires Authentication (JWT token, req.user._id)
 * @body {String} recipeId - Which recipe to comment on (required)
 * @body {String} text - Comment text (required, 1-1000 chars)
 * @body {Number} rating - Optional rating (1-5 stars)
 * @returns {201} Created Comment object
 * @returns {400} If validation fails
 */
exports.createComment = async (req, res) => {
  try {
    // Get authenticated user's ID
    const userId = req.user._id;
    // Extract comment data from request body
    const { recipeId, text, rating } = req.body;

    // Call service layer to create comment
    const comment = await commentService.createComment({
      recipeId,
      userId,
      text,
      rating,
    });

    // ========== QUEUE NOTIFICATION EMAIL (BACKGROUND JOB) ==========
    // Email recipe owner that someone commented on their recipe
    // Non-blocking: email job runs independently, doesn't delay response
    (async () => {
      try {
        // Find recipe and populate owner's email + name
        const recipe = await Recipe.findById(recipeId).populate(
          "user",
          "email name",
        );

        // If recipe exists and has owner with email
        if (recipe && recipe.user && recipe.user.email) {
          // Queue notification email to recipe owner
          await queueEmail(recipe.user.email, "comment", {
            recipeTitle: recipe.title, // Recipe name
            commenterName: comment.username, // Who commented
          });
        }
      } catch (err) {
        // Log error but don't fail the request
        console.error(
          "Failed to queue comment notification email:",
          err.message,
        );
      }
    })();

    // ========== SEND RESPONSE ==========
    // Status 201: Created (new comment created)
    sendSuccess(res, 201, "Comment posted successfully", comment);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "COMMENT_CREATE_FAILED", error.message, { recipeId });
  }
};

// ========== UPDATE OPERATIONS / PUT ==========

/**
 * HANDLER: PUT /api/comments/:id
 * Update existing comment
 * Only comment creator can update their own comments
 * Updates text and/or rating, tracks edit timestamp
 * @route PUT /api/comments/66f1a2b3c4d5e6f7g8h9i0j1
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.id - Comment MongoDB ID
 * @body {String} text - Updated comment text (optional)
 * @body {Number} rating - Updated rating (optional, 1-5)
 * @returns {200} Updated Comment object
 * @returns {400} If authorization fails or validation fails
 * @returns {403} If user is not comment creator
 */
exports.updateComment = async (req, res) => {
  try {
    // Extract comment ID from URL parameter
    const commentId = req.params.id;
    // Get authenticated user's ID for authorization check
    const userId = req.user._id;
    // Extract updated fields from request body
    const { text, rating } = req.body;

    // Call service layer to update comment (checks authorization)
    const comment = await commentService.updateComment(commentId, userId, {
      text,
      rating,
    });

    // Success response with updated comment
    sendSuccess(res, 200, "Comment updated successfully", comment);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "COMMENT_UPDATE_FAILED", error.message, { commentId });
  }
};

// ========== DELETE OPERATIONS ==========

/**
 * HANDLER: DELETE /api/comments/:id
 * Delete comment permanently
 * Only comment creator can delete their own comments
 * @route DELETE /api/comments/66f1a2b3c4d5e6f7g8h9i0j1
 * @requires Authentication (JWT token, req.user._id)
 * @param {String} req.params.id - Comment MongoDB ID
 * @returns {200} Success message
 * @returns {400} If not authorized or other error
 * @returns {404} If comment not found
 */
exports.deleteComment = async (req, res) => {
  try {
    // Extract comment ID from URL parameter
    const commentId = req.params.id;
    // Get authenticated user's ID for authorization check
    const userId = req.user._id;

    // Call service layer to delete comment (checks authorization)
    const result = await commentService.deleteComment(commentId, userId);

    // Success response with message
    sendSuccess(res, 200, result.message);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "COMMENT_DELETE_FAILED", error.message, { commentId });
  }
};

// ========== FILTERED GET OPERATIONS ==========

/**
 * HANDLER: GET /api/comments/user/:userId
 * Get all comments created by specific user with pagination
 * Includes all comments with their recipes and ratings
 * @route GET /api/comments/user/66f1a2b3c4d5e6f7g8h9i0j1?page=1&limit=10
 * @param {String} req.params.userId - User MongoDB ID
 * @query {Number} page - Page number (default: 1)
 * @query {Number} limit - Results per page (default: 10)
 * @returns {200} Paginated array of user's comments with pagination info
 * @returns {404} If user not found
 */
exports.getCommentsByUser = async (req, res) => {
  try {
    // Extract user ID from URL parameter
    const userId = req.params.userId;
    // Extract pagination params from query string
    const { page, limit } = req.query;

    // Call service layer to fetch paginated comments by user
    const result = await commentService.getCommentsByUser(userId, page, limit);

    // Send paginated response with data and pagination metadata
    sendPaginated(
      res,
      200,
      "User comments retrieved",
      result.data || result.comments, // Array of comments
      result.pagination, // {total, page, pages}
    );
  } catch (error) {
    // Determine status code: 404 if user not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    const code =
      statusCode === 404 ? "USER_NOT_FOUND" : "USER_COMMENTS_FETCH_FAILED";
    sendError(res, statusCode, code, error.message, { userId });
  }
};

/**
 * HANDLER: GET /api/comments/recipe/:recipeId/ratings
 * Get aggregate ratings for recipe (average, count, distribution)
 * Calculates stats from all comments with ratings on recipe
 * @route GET /api/comments/recipe/66f1a2b3c4d5e6f7g8h9i0j1/ratings
 * @param {String} req.params.recipeId - Recipe MongoDB ID
 * @returns {200} Rating stats object {
 *   average: average rating,
 *   count: total ratings,
 *   distribution: {1-star count, 2-star count, ...}
 * }
 * @returns {404} If recipe not found
 */
exports.getRecipeRatings = async (req, res) => {
  try {
    // Extract recipe ID from URL parameter
    const recipeId = req.params.recipeId;

    // Call service layer to calculate ratings
    const ratings = await commentService.getRecipeRatings(recipeId);

    // Success response with ratings stats
    sendSuccess(res, 200, "Recipe ratings retrieved", ratings);
  } catch (error) {
    // Determine status code: 404 if recipe not found, 400 otherwise
    const statusCode = error.message.includes("not found") ? 404 : 400;
    sendError(res, statusCode, "RATING_FETCH_FAILED", error.message, {
      recipeId,
    });
  }
};
