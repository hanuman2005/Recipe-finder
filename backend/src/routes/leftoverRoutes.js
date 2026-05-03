/**
 * LEFTOVER ROUTES - Express Routes (Feature #2)
 *
 * Purpose:
 * Map HTTP endpoints to leftover controller handlers
 * All user routes require authentication
 * Admin routes require admin role
 *
 * Base Route: /api/leftovers
 */

const express = require("express");
const leftoverController = require("../controllers/leftoverController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { createDeleteLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

/**
 * ========== USER ROUTES (PROTECTED) ==========
 * All require authentication - user must be logged in
 */

/**
 * POST /api/leftovers
 * Add a new leftover ingredient after cooking recipe
 * System automatically schedules 12-hour notification
 * Rate limited: 50 per 15 minutes per user
 *
 * @requires Authentication (JWT token)
 * @body {String} ingredientName - Name of ingredient (e.g., "cream")
 * @body {Number} quantity - Amount remaining (e.g., 300)
 * @body {String} unit - Unit of measurement (ml, g, cup, tbsp, etc)
 * @body {String} recipeId - Optional: Recipe where ingredient came from
 * @returns {201} Created LeftoverInventory document
 */
router.post("/", protect, createDeleteLimiter, leftoverController.addLeftover);

/**
 * GET /api/leftovers
 * Get all leftovers in user's pantry
 * Shows active, non-expired leftovers
 *
 * @requires Authentication (JWT token)
 * @query {String} sort - "expiry" | "recent" | "quantity" (default: expiry)
 * @query {String} filter - "active" | "expiring_soon" | "all" (default: active)
 * @returns {200} Array of leftovers with details
 * @example GET /api/leftovers?sort=expiry&filter=active
 */
router.get("/", protect, leftoverController.getUserPantry);

/**
 * GET /api/leftovers/:leftoverId
 * Get full details for specific leftover
 * Includes image, expiration, and recipe suggestions
 *
 * @requires Authentication (JWT token)
 * @param {String} leftoverId - Leftover MongoDB ID
 * @returns {200} Full leftover details + suggested recipes
 */
router.get("/:leftoverId", protect, leftoverController.getLeftoverDetails);

/**
 * GET /api/leftovers/:leftoverId/suggestions
 * Get recipe suggestions for specific leftover
 *
 * @requires Authentication (JWT token)
 * @param {String} leftoverId - Leftover MongoDB ID
 * @query {Number} limit - Max recipes to return (default: 5)
 * @query {String} sort - "rating" | "prepTime" | "difficulty"
 * @returns {200} Array of recipe suggestions
 */
router.get(
  "/:leftoverId/suggestions",
  protect,
  leftoverController.getSuggestions,
);

/**
 * DELETE /api/leftovers/:leftoverId
 * Remove leftover from pantry
 * Use when leftover is used, expired, or discarded
 *
 * @requires Authentication (JWT token)
 * @param {String} leftoverId - Leftover MongoDB ID
 * @body {String} reason - "used" | "expired" | "discarded" (optional)
 * @returns {200} Success message
 */
router.delete(
  "/:leftoverId",
  protect,
  createDeleteLimiter,
  leftoverController.removeLeftover,
);

/**
 * GET /api/leftovers/stats
 * Get user's waste prevention statistics
 * Shows total waste prevented, recipes cooked, etc
 *
 * @requires Authentication (JWT token)
 * @returns {200} Statistics object with metrics
 */
router.get("/stats", protect, leftoverController.getStatistics);

/**
 * ========== ADMIN ROUTES (PROTECTED + ADMIN ONLY) ==========
 * Require authentication AND admin role
 */

/**
 * POST /api/admin/leftovers/batch-process
 * Manually trigger leftover notification processing
 * Generates suggestions and sends notifications for all unnotified leftovers
 * Used for testing or recovery after system issues
 *
 * @requires Authentication (JWT token) + Admin role
 * @returns {200} Batch processing result {totalProcessed, totalFailed}
 */
router.post(
  "/admin/batch-process",
  protect,
  restrictTo("admin"),
  leftoverController.batchProcess,
);

module.exports = router;
