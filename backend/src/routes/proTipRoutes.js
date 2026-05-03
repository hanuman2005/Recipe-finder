// ========== PRO TIP ROUTES - API ENDPOINT DEFINITIONS ==========
// Feature #4: Street-Style Secret Technique Library
// Community-submitted pro tips for recipe steps

const express = require("express");
const router = express.Router({ mergeParams: true }); // Merge recipe params

// ========== IMPORT CONTROLLERS ==========
const {
  submitProTip, // POST - User submits pro tip
  getApprovedProTips, // GET - View approved tips
  markTipHelpful, // POST - Upvote/downvote tip
  getUserProTips, // GET - User's submissions
  getPendingProTips, // GET - Admin moderation dashboard
  approveProTip, // POST - Admin approves tip
  rejectProTip, // POST - Admin rejects tip
  getAIProTips, // GET - AI-generated tips (Feature #4 enhancement)
} = require("../controllers/proTipController");

// ========== IMPORT MIDDLEWARE ==========
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { createDeleteLimiter } = require("../middleware/rateLimitMiddleware");

// ========== USER ROUTES - PUBLIC/PROTECTED ==========

/**
 * ROUTE: GET /api/recipes/:recipeId/pro-tips
 * Get all APPROVED pro tips for a recipe
 * Public route - anyone can view (no auth required)
 *
 * @query {Number} stepNumber - Optional: Filter by specific step
 * @returns {200} Array of approved ProTipSubmission
 *
 * @example GET /api/recipes/507f1f77bcf86cd799439011/pro-tips
 * @example GET /api/recipes/507f1f77bcf86cd799439011/pro-tips?stepNumber=3
 */
router.get("/:recipeId/pro-tips", getApprovedProTips);

/**
 * ROUTE: POST /api/recipes/:recipeId/pro-tips
 * Submit a pro tip for a recipe step (COMMUNITY)
 * Requires: Authentication (user submitting tip)
 * Tip starts as PENDING until admin approves
 *
 * @requires Authentication (JWT token)
 * @param {String} recipeId - Recipe MongoDB ID
 * @body {Number} stepNumber - Step number in recipe
 * @body {String} title - Technique name
 * @body {String} technique - Technique description
 * @body {String} level - Difficulty level
 * @body {Number} temperature - Optional cooking temperature
 * @body {String} timing - How long to cook
 * @body {String} explanation - Why this works
 * @body {String} region - Where from (e.g., Hyderabad)
 * @body {String} videoUrl - Optional YouTube link
 * @returns {201} Created ProTipSubmission (status: pending)
 *
 * @example POST /api/recipes/507f.../pro-tips
 * @body {
 *   "stepNumber": 3,
 *   "title": "Double-Fry Technique",
 *   "technique": "Fry twice at different temperatures",
 *   "level": "Advanced",
 *   "temperature": 180,
 *   "timing": "30 seconds each",
 *   "explanation": "First fry sets crust, second creates texture",
 *   "region": "Hyderabad",
 *   "videoUrl": "https://youtube.com/..."
 * }
 */
router.post(
  "/:recipeId/pro-tips",
  protect, // Authentication required
  createDeleteLimiter, // Rate limit: 30 submissions/15min per user
  submitProTip, // Handler
);

/**
 * ROUTE: POST /api/pro-tips/:tipId/helpful
 * Mark pro tip as helpful (upvote/downvote)
 * Requires: Authentication
 *
 * @requires Authentication (JWT token)
 * @param {String} tipId - ProTipSubmission MongoDB ID
 * @returns {200} Updated ProTipSubmission with new helpful count
 *
 * @example POST /api/pro-tips/507f.../helpful
 * First click: upvotes tip
 * Second click: downvotes (removes upvote)
 */
router.post("/:tipId/helpful", protect, markTipHelpful);

/**
 * ROUTE: GET /api/my-pro-tips
 * Get current user's submitted pro tips
 * Requires: Authentication
 * Shows status: pending, approved, rejected
 *
 * @requires Authentication (JWT token)
 * @returns {200} Array of ProTipSubmission by user
 *
 * @example GET /api/my-pro-tips
 * Returns:
 * [
 *   { id: "1", title: "Double-fry", status: "approved", recipe: "Pakora", ... },
 *   { id: "2", title: "Tempering", status: "pending", recipe: "Dal", ... },
 *   { id: "3", title: "Fermentation", status: "rejected", recipe: "Dosa", reason: "Too vague" }
 * ]
 */
router.get("/my-pro-tips", protect, getUserProTips);

/**
 * ROUTE: GET /api/recipes/:recipeId/ai-tips
 * Feature #4 Enhancement: Get AI-generated pro tips for recipe
 * Public route - anyone can view AI tips as alternative to community tips
 * Uses Grok AI to generate professional cooking techniques
 *
 * @param {String} recipeId - Recipe MongoDB ID
 * @query {Number} stepNumber - Optional: Filter AI tips for specific step
 * @returns {200} Array of AI-generated tips with 🤖 badge
 *
 * @example GET /api/recipes/507f1f77bcf86cd799439011/ai-tips
 * @example GET /api/recipes/507f1f77bcf86cd799439011/ai-tips?stepNumber=2
 */
router.get("/:recipeId/ai-tips", getAIProTips);

// ========== ADMIN ROUTES - MODERATION ==========

/**
 * ROUTE: GET /api/admin/pro-tips/pending
 * Admin dashboard: View pending pro tips for moderation
 * Requires: Authentication + Admin role
 * Returns newest submissions first
 *
 * @requires Authentication (JWT token + Admin role)
 * @query {Number} page - Page number (default: 1)
 * @query {Number} limit - Results per page (default: 20, max: 100)
 * @returns {200} Paginated pending ProTipSubmission array
 *
 * @example GET /api/admin/pro-tips/pending?page=1&limit=20
 */
router.get(
  "/admin/pro-tips/pending", // Admin route
  protect, // Authentication required
  restrictTo("admin"), // Admin role required
  getPendingProTips, // Handler
);

/**
 * ROUTE: POST /api/admin/pro-tips/:tipId/approve
 * Admin approves pro tip and makes visible to users
 * Requires: Authentication + Admin role
 * Changes status: pending → approved
 *
 * @requires Authentication (JWT token + Admin role)
 * @param {String} tipId - ProTipSubmission MongoDB ID
 * @body {String} comment - Optional approval comment
 * @returns {200} Approved ProTipSubmission
 *
 * @example POST /api/admin/pro-tips/507f.../approve
 * @body { "comment": "Great technique! Approved." }
 */
router.post(
  "/admin/pro-tips/:tipId/approve",
  protect, // Authentication required
  restrictTo("admin"), // Admin only
  approveProTip, // Handler
);

/**
 * ROUTE: POST /api/admin/pro-tips/:tipId/reject
 * Admin rejects pro tip (doesn't make it visible)
 * Requires: Authentication + Admin role
 * Changes status: pending → rejected
 *
 * @requires Authentication (JWT token + Admin role)
 * @param {String} tipId - ProTipSubmission MongoDB ID
 * @body {String} reason - Reason for rejection
 * @returns {200} Rejected ProTipSubmission
 *
 * @example POST /api/admin/pro-tips/507f.../reject
 * @body { "reason": "Technique too dangerous, not recommended" }
 */
router.post(
  "/admin/pro-tips/:tipId/reject",
  protect, // Authentication required
  restrictTo("admin"), // Admin only
  rejectProTip, // Handler
);

// ========== EXPORT ==========
module.exports = router;
