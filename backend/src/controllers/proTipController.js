// ========== PRO TIP CONTROLLER - HTTP REQUEST HANDLERS ==========
// Feature #4: Street-Style Secret Technique Library
// Handles pro tip submission, moderation, and retrieval

const proTipService = require("../services/proTipService");
const {
  sendSuccess,
  sendError,
  sendPaginated,
} = require("../utils/responseHandler");

// ========== USER OPERATIONS ==========

/**
 * HANDLER: POST /api/recipes/:recipeId/pro-tips
 * Community user submits a pro tip for a recipe step
 * @route POST /api/recipes/:recipeId/pro-tips
 * @requires Authentication (JWT token)
 * @param {String} req.params.recipeId - Recipe MongoDB ID
 * @body {Number} stepNumber - Step number in recipe
 * @body {String} title - Technique name
 * @body {String} technique - Technique description
 * @body {String} level - Difficulty: Beginner/Intermediate/Advanced
 * @body {Number} temperature - Optional cooking temperature
 * @body {String} timing - How long to cook
 * @body {String} explanation - Why this technique works
 * @body {String} region - Where technique originates
 * @body {String} videoUrl - Optional YouTube link
 * @returns {201} Created ProTipSubmission
 */
exports.submitProTip = async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    const {
      stepNumber,
      title,
      technique,
      level,
      temperature,
      timing,
      explanation,
      region,
      videoUrl,
    } = req.body;

    // ========== VALIDATE REQUIRED FIELDS ==========
    if (!stepNumber || !title || !explanation) {
      return sendError(
        res,
        400,
        "MISSING_FIELDS",
        "Step number, title, and explanation required",
      );
    }

    // ========== CALL SERVICE ==========
    const proTip = await proTipService.submitProTip(
      recipeId,
      parseInt(stepNumber),
      req.user._id,
      {
        title,
        technique,
        level,
        temperature: temperature ? parseInt(temperature) : null,
        timing,
        explanation,
        region,
        videoUrl,
      },
    );

    // Success: Tip submitted and awaiting review
    sendSuccess(res, 201, "Pro tip submitted for review", proTip);
  } catch (error) {
    next(error);
  }
};

/**
 * HANDLER: GET /api/recipes/:recipeId/pro-tips
 * Get all APPROVED pro tips for a recipe
 * @route GET /api/recipes/:recipeId/pro-tips
 * @param {String} req.params.recipeId - Recipe MongoDB ID
 * @query {Number} stepNumber - Optional: Get tips only for specific step
 * @returns {200} Array of approved ProTipSubmission
 */
exports.getApprovedProTips = async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    const { stepNumber } = req.query;

    // ========== CALL SERVICE ==========
    const proTips = await proTipService.getApprovedProTips(
      recipeId,
      stepNumber ? parseInt(stepNumber) : null,
    );

    // Success response
    sendSuccess(res, 200, "Pro tips retrieved", proTips);
  } catch (error) {
    next(error);
  }
};

/**
 * HANDLER: POST /api/pro-tips/:tipId/helpful
 * User marks a pro tip as helpful (upvote/downvote)
 * @route POST /api/pro-tips/:tipId/helpful
 * @requires Authentication (JWT token)
 * @param {String} req.params.tipId - ProTipSubmission MongoDB ID
 * @returns {200} Updated ProTipSubmission with new helpful count
 */
exports.markTipHelpful = async (req, res, next) => {
  try {
    const { tipId } = req.params;

    // ========== CALL SERVICE ==========
    const proTip = await proTipService.markTipHelpful(tipId, req.user._id);

    // Success response
    sendSuccess(
      res,
      200,
      `Tip ${proTip.upvotes.includes(req.user._id) ? "upvoted" : "downvoted"}`,
      proTip,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * HANDLER: GET /api/my-pro-tips
 * Get current user's submitted pro tips
 * @route GET /api/my-pro-tips
 * @requires Authentication (JWT token)
 * @returns {200} Array of ProTipSubmission submitted by user
 */
exports.getUserProTips = async (req, res, next) => {
  try {
    // ========== CALL SERVICE ==========
    const proTips = await proTipService.getUserProTips(req.user._id);

    // Success response
    sendSuccess(res, 200, "Your pro tips retrieved", proTips);
  } catch (error) {
    next(error);
  }
};

// ========== ADMIN OPERATIONS ==========

/**
 * HANDLER: GET /api/admin/pro-tips/pending
 * Admin dashboard: View pending pro tips for moderation
 * @route GET /api/admin/pro-tips/pending
 * @requires Authentication (JWT token + Admin role)
 * @query {Number} page - Page number (default: 1)
 * @query {Number} limit - Results per page (default: 20)
 * @returns {200} Paginated pending ProTipSubmission array
 */
exports.getPendingProTips = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // ========== CALL SERVICE ==========
    const result = await proTipService.getPendingProTips(
      parseInt(page),
      parseInt(limit),
    );

    // Success response with pagination
    sendPaginated(res, 200, "Pending pro tips for review", result.data, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.pagination.total,
      pages: result.pagination.pages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * HANDLER: POST /api/admin/pro-tips/:tipId/approve
 * Admin approves a pro tip and makes it visible to users
 * @route POST /api/admin/pro-tips/:tipId/approve
 * @requires Authentication (JWT token + Admin role)
 * @param {String} req.params.tipId - ProTipSubmission MongoDB ID
 * @body {String} comment - Optional approval comment
 * @returns {200} Approved ProTipSubmission
 */
exports.approveProTip = async (req, res, next) => {
  try {
    const { tipId } = req.params;
    const { comment = "" } = req.body;

    // ========== CALL SERVICE ==========
    const proTip = await proTipService.approveProTip(
      tipId,
      req.user._id,
      comment,
    );

    // Success response
    sendSuccess(res, 200, "Pro tip approved and now visible to users", proTip);
  } catch (error) {
    next(error);
  }
};

/**
 * HANDLER: POST /api/admin/pro-tips/:tipId/reject
 * Admin rejects a pro tip (doesn't make it visible)
 * @route POST /api/admin/pro-tips/:tipId/reject
 * @requires Authentication (JWT token + Admin role)
 * @param {String} req.params.tipId - ProTipSubmission MongoDB ID
 * @body {String} reason - Reason for rejection
 * @returns {200} Rejected ProTipSubmission
 */
exports.rejectProTip = async (req, res, next) => {
  try {
    const { tipId } = req.params;
    const { reason = "" } = req.body;

    // ========== CALL SERVICE ==========
    const proTip = await proTipService.rejectProTip(
      tipId,
      req.user._id,
      reason,
    );

    // Success response
    sendSuccess(res, 200, "Pro tip rejected", proTip);
  } catch (error) {
    next(error);
  }
};

/**
 * HANDLER: GET /api/recipes/:recipeId/ai-tips
 * Feature #4 Enhancement: Get AI-generated pro tips for recipe
 * Alternative to community tips, powered by Grok AI
 *
 * @route GET /api/recipes/:recipeId/ai-tips
 * @param {String} req.params.recipeId - Recipe MongoDB ID
 * @query {Number} stepNumber - Optional: specific step number
 * @returns {200} Array of AI-generated tips with badge
 * @example GET /api/recipes/123abc/ai-tips
 * @example GET /api/recipes/123abc/ai-tips?stepNumber=2
 */
exports.getAIProTips = async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    const { stepNumber } = req.query;

    // Call service to generate AI tips
    const aiTips = await proTipService.generateAIProTips(
      recipeId,
      stepNumber ? parseInt(stepNumber) : null,
    );

    // Success response
    sendSuccess(res, 200, `Generated ${aiTips.length} AI pro tips`, {
      tips: aiTips,
      source: "ai_generated",
      badge: "🤖 AI-Suggested",
    });
  } catch (error) {
    next(error);
  }
};
