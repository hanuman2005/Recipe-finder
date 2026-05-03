// ========== AUTHENTICATION ROUTES - API ENDPOINT DEFINITIONS ==========
// Defines all HTTP routes for authentication operations
// Includes: registration, login, logout, token refresh, password change
// Each route specifies: HTTP method, path, middleware chain, and controller handler

// Import Express router
const express = require("express");

// ========== IMPORT CONTROLLER HANDLERS ==========
// HTTP handler functions from authController
const {
  registerUser, // POST - create new user account
  loginUser, // POST - authenticate user credentials
  logout, // POST - logout user and clear session
  refreshToken, // POST - refresh access token using refresh token
  changePassword, // POST - change user password (requires old password)
} = require("../controllers/authController");

// ========== IMPORT MIDDLEWARE ==========

// Authentication middleware - checks JWT token and sets req.user
const { protect } = require("../middleware/authMiddleware");

// Rate limiting middleware - prevents abuse
const { authLimiter } = require("../middleware/rateLimitMiddleware"); // Auth limiter: 5 req/15min (prevents brute force)

// Validation middleware - validates request data with Zod schemas
const { validate } = require("../middleware/validationMiddleware"); // Validates request body

// ========== IMPORT VALIDATION SCHEMAS ==========
// Zod schemas that define valid request data structure

const {
  userRegisterValidation, // Schema for POST /register
  userLoginSchema, // Schema for POST /login
  changePasswordValidation, // Schema for POST /change-password
} = require("../validations/userValidation");

const router = express.Router();

// ========== AUTHENTICATION ROUTES ==========

/**
 * ROUTE: POST /api/auth/register
 * Register new user account
 * Creates user with email, password, name
 * Sets httpOnly cookie with refresh token
 * Queues welcome email
 * Middleware chain: authLimiter → validate → registerUser handler
 *
 * @body {String} email - User's email (required, unique, must be valid format)
 * @body {String} password - User's password (required, 6+ chars, 1 uppercase, 1 lowercase, 1 digit)
 * @body {String} name - User's display name (required)
 * @returns {201} User object and access token (refresh token in httpOnly cookie)
 * @returns {400} If validation fails or email already exists
 */
router.post(
  "/register", // Path
  authLimiter, // Rate limiting: 5 req/15min per IP (prevents brute force account creation)
  validate(userRegisterValidation), // Validate body data matches registration schema
  registerUser, // Handler
);

/**
 * ROUTE: POST /api/auth/login
 * Authenticate user with email and password
 * Verifies credentials and generates tokens
 * Sets httpOnly cookie with refresh token
 * Middleware chain: authLimiter → validate → loginUser handler
 *
 * @body {String} email - User's email (required)
 * @body {String} password - User's password (required)
 * @returns {200} User object and access token (refresh token in httpOnly cookie)
 * @returns {400} If validation fails
 * @returns {401} If credentials invalid (email not found or password wrong)
 */
router.post(
  "/login", // Path
  authLimiter, // Rate limiting: 5 req/15min per IP (prevents brute force login attempts)
  validate(userLoginSchema), // Validate body data matches login schema
  loginUser, // Handler
);

/**
 * ROUTE: POST /api/auth/refresh
 * Refresh access token using refresh token
 * When access token expires (15m), send refresh token to get new access token
 * Generates new access token and new refresh token
 * Middleware chain: refreshToken handler
 *
 * @cookie {String} refreshToken - httpOnly cookie from login/register
 * @returns {200} New access token (new refresh token in httpOnly cookie)
 * @returns {401} If refresh token invalid or expired
 */
router.post(
  "/refresh", // Path
  refreshToken, // Handler (no middleware)
);

/**
 * ROUTE: POST /api/auth/logout
 * Logout user and clear session
 * Clears refresh token cookie
 * Client must also clear access token from localStorage/state
 * Middleware chain: protect → logout handler
 *
 * @requires Authentication (JWT token)
 * @returns {200} Success message
 */
router.post(
  "/logout", // Path
  protect, // Authentication required
  logout, // Handler
);

/**
 * ROUTE: POST /api/auth/change-password
 * Change authenticated user's password
 * Requires old password for verification before allowing change
 * Creates new hashed password
 * Middleware chain: protect → validate → changePassword handler
 *
 * @requires Authentication (JWT token)
 * @body {String} oldPassword - Current password (required, must be correct)
 * @body {String} newPassword - New password (required, 6+ chars, must be different from old)
 * @returns {200} Success message
 * @returns {400} If old password wrong or new password too weak
 */
router.post(
  "/change-password", // Path
  protect, // Authentication required
  validate(changePasswordValidation), // Validate body data matches change password schema
  changePassword, // Handler
);

// ========== EXPORT ROUTER ==========
// Export this router to be mounted in main app.js
// Usage in app.js: app.use('/api/auth', require('./routes/authRoutes'))
module.exports = router;
