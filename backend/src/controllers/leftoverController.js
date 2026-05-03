/**
 * LEFTOVER CONTROLLER - HTTP Request Handlers (Feature #2)
 *
 * Purpose:
 * Expose leftoverService methods via REST API
 * Handles requests for:
 * - Adding leftovers after cooking
 * - Viewing user's pantry
 * - Getting recipe suggestions for leftovers
 * - Removing leftovers
 * - Batch processing (admin)
 */

const leftoverService = require("../services/leftoverService");
const AppError = require("../utils/AppError");
const responseHandler = require("../utils/responseHandler");

/**
 * ADD LEFTOVER - Save leftover ingredient after cooking
 *
 * When user completes a recipe, they can save leftovers
 * System schedules 12-hour notification with recipe suggestions
 *
 * Request Body:
 * {
 *   ingredientId: "object_id_here",
 *   ingredientName: "cream",
 *   quantity: 300,
 *   unit: "ml",
 *   recipeId: "recipe_id_here"  (optional)
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     _id: "leftover_id",
 *     user: "user_id",
 *     ingredient: "cream",
 *     quantity: 300,
 *     unit: "ml",
 *     expiresAt: "2026-04-10T12:00:00Z",
 *     notificationScheduled: true
 *   }
 * }
 */
exports.addLeftover = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { ingredientId, ingredientName, quantity, unit, recipeId } = req.body;

    // Validate input
    if (!ingredientName && !ingredientId) {
      return next(
        new AppError("Either ingredientName or ingredientId is required", 400),
      );
    }

    if (!quantity || quantity <= 0) {
      return next(new AppError("Valid quantity is required", 400));
    }

    if (!unit) {
      return next(new AppError("Unit (ml, g, cup, etc) is required", 400));
    }

    // Add leftover
    const leftover = await leftoverService.addLeftover({
      userId,
      ingredientId,
      ingredientName,
      quantity,
      unit,
      recipeId,
    });

    return responseHandler.success(res, leftover, 201);
  } catch (error) {
    console.error(`❌ Controller Error - addLeftover:`, error.message);
    return next(error);
  }
};

/**
 * GET USER PANTRY - View all leftovers user has saved
 *
 * Lists user's active leftovers with expiration dates
 * Organized by ingredient type
 *
 * Query Params:
 * - sort: "expiry", "recent", "quantity" (default: expiry)
 * - filter: "active", "expiring_soon", "all" (default: active)
 *
 * Example:
 * GET /api/leftovers?sort=expiry&filter=active
 *
 * Returns:
 * {
 *   success: true,
 *   data: [
 *     {
 *       _id: "id1",
 *       ingredient: "cream",
 *       quantity: 300,
 *       unit: "ml",
 *       expiresAt: "2026-04-10T12:00:00Z",
 *       expiresIn: "2.5 days",
 *       image: "url"
 *     }
 *   ],
 *   count: 3
 * }
 */
exports.getUserPantry = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sort = "expiry", filter = "active" } = req.query;

    // Get pantry
    const pantry = await leftoverService.getUserPantry(userId, {
      sort,
      filter,
    });

    return responseHandler.success(res, {
      leftovers: pantry,
      count: pantry.length,
    });
  } catch (error) {
    console.error(`❌ Controller Error - getUserPantry:`, error.message);
    return next(error);
  }
};

/**
 * REMOVE LEFTOVER - Delete from pantry
 *
 * User removes leftover they've already used or discarded
 *
 * Request Body:
 * {
 *   reason: "used", "expired", "discarded" (optional for tracking)
 * }
 *
 * Example:
 * DELETE /api/leftovers/leftover_id
 *
 * Returns:
 * {
 *   success: true,
 *   message: "Leftover removed"
 * }
 */
exports.removeLeftover = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { leftoverId } = req.params;

    // Remove
    await leftoverService.removeLeftover(leftoverId, userId);

    return responseHandler.success(res, null, 200, "Leftover removed");
  } catch (error) {
    console.error(`❌ Controller Error - removeLeftover:`, error.message);
    return next(error);
  }
};

/**
 * GET LEFTOVER DETAILS - Full details + recipe suggestions
 *
 * Shows leftover with image, expiration, and suggested recipes
 *
 * Example:
 * GET /api/leftovers/leftover_id
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     _id: "id",
 *     ingredient: {name, image, nutritionInfo},
 *     quantity: 300,
 *     unit: "ml",
 *     expiresAt: "date",
 *     suggestions: [
 *       {title: "Recipe 1", rating: 4.8, prepTime: 25},
 *       {title: "Recipe 2", rating: 4.5, prepTime: 30}
 *     ]
 *   }
 * }
 */
exports.getLeftoverDetails = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { leftoverId } = req.params;

    // Get details
    const details = await leftoverService.getLeftoverDetails(
      leftoverId,
      userId,
    );

    return responseHandler.success(res, details);
  } catch (error) {
    console.error(`❌ Controller Error - getLeftoverDetails:`, error.message);
    return next(error);
  }
};

/**
 * GET RECIPE SUGGESTIONS FOR LEFTOVER
 *
 * Get recipes that use a specific leftover ingredient
 *
 * Query Params:
 * - limit: 5 (default) - max recipes to return
 * - sort: "rating", "prepTime", "difficulty"
 *
 * Example:
 * GET /api/leftovers/leftover_id/suggestions?limit=5&sort=rating
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     leftover: {ingredientName, quantity, unit},
 *     suggestions: [
 *       {title, image, rating, prepTime, difficulty, servings},
 *       ...
 *     ]
 *   }
 * }
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { leftoverId } = req.params;
    const { limit = 5, sort = "rating" } = req.query;

    // Get leftover first
    const leftover = await leftoverService.getLeftoverDetails(
      leftoverId,
      userId,
    );

    // Get suggestions
    const suggestions = await leftoverService.generateRecipeSuggestions(
      leftover.ingredientName,
      userId,
      parseInt(limit),
    );

    return responseHandler.success(res, {
      leftover: {
        ingredientName: leftover.ingredientName,
        quantity: leftover.quantity,
        unit: leftover.unit,
        expiresAt: leftover.expiresAt,
      },
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error(`❌ Controller Error - getSuggestions:`, error.message);
    return next(error);
  }
};

/**
 * GET STATISTICS - Waste prevention metrics
 *
 * Shows how much waste user has prevented
 * Motivational data for user engagement
 *
 * Example:
 * GET /api/leftovers/stats
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     totalLeftoversSaved: 15,
 *     recipesCooked: 8,
 *     wastePrevented: {
 *       weight: "2.5kg",
 *       value: "$35.50"
 *     },
 *     thisMonth: {...},
 *     thisYear: {...}
 *   }
 * }
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get stats
    const stats = await leftoverService.getStatistics(userId);

    return responseHandler.success(res, stats);
  } catch (error) {
    console.error(`❌ Controller Error - getStatistics:`, error.message);
    return next(error);
  }
};

/**
 * BATCH PROCESS LEFTOVERS - Admin endpoint
 *
 * Manually trigger leftover processing for all users
 * Generates suggestions and sends notifications
 * Used for testing or recovery
 *
 * Example:
 * POST /api/admin/leftovers/batch-process
 *
 * Returns:
 * {
 *   success: true,
 *   message: "Batch processed",
 *   data: {
 *     totalProcessed: 42,
 *     totalFailed: 2,
 *     timestamp: "2026-04-07T12:00:00Z"
 *   }
 * }
 */
exports.batchProcess = async (req, res, next) => {
  try {
    // Admin only - check done in middleware

    // Batch process
    const result = await leftoverService.batchProcessLeftovers();

    return responseHandler.success(res, result);
  } catch (error) {
    console.error(`❌ Controller Error - batchProcess:`, error.message);
    return next(error);
  }
};
