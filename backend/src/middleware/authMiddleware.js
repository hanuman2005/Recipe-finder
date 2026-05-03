// ========== AUTHENTICATION MIDDLEWARE ==========
// Protects routes by verifying JWT tokens
// All protected routes use this middleware to ensure user is logged in
// Middleware works by: Extract token → Verify token → Attach user to request

// Import JWT library for token verification
const jwt = require("jsonwebtoken"); // jsonwebtoken - creates and verifies secure tokens
// Import User model to fetch user details from database
const User = require("../models/User"); // MongoDB User model

/**
 * MIDDLEWARE: Protect - Verify user authentication
 * Applied to protected routes (e.g., GET /api/users/me, POST /api/recipes)
 * Checks if valid JWT token is provided and user exists
 *
 * Usage in routes:
 * router.get('/recipes', protect, recipeController.getRecipes);
 * // protect middleware runs first, then recipeController is called
 *
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next function to pass control to next middleware/controller
 */
const protect = async (req, res, next) => {
  // ========== VARIABLE: Initialize token as undefined ==========
  // Will hold JWT token from request headers if provided
  let token;

  // ========== STEP 1: EXTRACT TOKEN FROM HEADERS ==========
  // Check if Authorization header exists AND starts with "Bearer"
  // Authorization header format: "Bearer eyJhbGciOiJIUzI1NiIs..."
  if (
    req.headers.authorization && // Check header exists
    req.headers.authorization.startsWith("Bearer") // Check it starts with "Bearer"
  ) {
    try {
      // ========== STEP 2: PARSE TOKEN FROM AUTHORIZATION HEADER ==========
      // Split "Bearer TOKEN" by space and get the token part (index 1)
      // Example: "Bearer abc123token" → ["Bearer", "abc123token"] → "abc123token"
      token = req.headers.authorization.split(" ")[1];

      // ========== STEP 3: VERIFY JWT TOKEN ==========
      // jwt.verify() checks if:
      // 1. Token signature is valid (not tampered with)
      // 2. Token hasn't expired
      // 3. Secret key matches
      // If valid, returns decoded payload with userId
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // decoded.id contains the user ID that was signed into the token during login

      // ========== STEP 4: FETCH USER FROM DATABASE ==========
      // Use decoded user ID to look up user in database
      // .select("-password") excludes password field from response (security)
      req.user = await User.findById(decoded.id).select("-password");

      // ========== STEP 5: CHECK USER STILL EXISTS ==========
      // User might have been deleted since token was issued
      if (!req.user) {
        // Return 404 error - user not found
        return res.status(404).json({
          success: false,
          error: "User not found", // User deleted or token has wrong ID
        });
      }

      // ========== STEP 6: PASS CONTROL TO NEXT MIDDLEWARE ==========
      // Token validated, user found, attach user to request
      // Now controller can access req.user to know who made the request
      next(); // Continue to controller

      // ========== ERROR HANDLING: Token verification failed ==========
    } catch (error) {
      // Token verification threw an error (invalid signature, expired, etc)
      return res.status(401).json({
        success: false,
        error: "Not authorized - invalid or expired token",
      });
    }

    // ========== NO TOKEN PROVIDED ==========
  } else {
    // Authorization header not found or doesn't start with "Bearer"
    return res.status(401).json({
      success: false,
      error: "Not authorized - no token provided", // User must login first
    });
  }
};

/**
 * MIDDLEWARE: Restrict Access - Check user role after authentication
 * Must be used AFTER protect middleware - checks if authenticated user has required role
 * Applied to admin/restricted routes (e.g., POST /api/recipes/:id/approve)
 *
 * Usage in routes:
 * router.post('/approve', protect, restrictTo("admin"), proTipController.approveProTip);
 * // protect runs first (validates user), then restrictTo checks role
 *
 * @param {String} ...roles - One or more role names (e.g., "admin", "moderator")
 * @returns {Function} Middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // ========== STEP 1: CHECK IF USER IS AUTHENTICATED ==========
    // req.user should be set by protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated - please login first",
      });
    }

    // ========== STEP 2: CHECK IF USER ROLE IS IN ALLOWED ROLES ==========
    // Check if user's role exists in the roles array passed to middleware
    // Example: restrictTo("admin", "moderator") checks if user.role is "admin" or "moderator"
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Not authorized - this action requires one of: ${roles.join(", ")} role`,
        userRole: req.user.role, // Show user what their role is
      });
    }

    // ========== STEP 3: PASS CONTROL TO NEXT MIDDLEWARE ==========
    // User has required role, allow request to proceed
    next(); // Continue to controller
  };
};

// ========== EXPORT MIDDLEWARE ==========
// Export protect and restrictTo functions for use in route files
module.exports = { protect, restrictTo };
