// ========== ERROR HANDLING MIDDLEWARE ==========
// Central error catcher for ALL errors in the application
// Must be the LAST middleware registered in app.js
// Catches errors from controllers, services, database, etc and sends consistent response

// Import custom AppError class for consistency
const AppError = require("../utils/AppError"); // Custom error class

/**
 * MIDDLEWARE: Error Handler
 * Catches ANY error thrown/passed in the application
 * Errors reach this middleware through: throw error or next(error)
 *
 * Express signatures middleware with 4 parameters to detect it as error handler:
 * (err, req, res, next) ← 4 parameters = error middleware
 *
 * Usage:
 * All routes should throw errors:
 * throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {recipeId})
 * This error is caught by errorMiddleware and sends consistent response
 *
 * @param {Error} err - Error object (can be AppError or any other Error)
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next function (for chain)
 */
const errorMiddleware = (err, req, res, next) => {
  // ========== LOG ERROR FOR DEBUGGING ==========
  // Always log errors to console/logs so developers can debug what went wrong
  console.error("❌ ERROR:", {
    code: err.code || "UNKNOWN_ERROR", // Error code (if AppError)
    message: err.message, // Error message
    statusCode: err.statusCode || 500, // HTTP status (default 500 if not set)
    endpoint: `${req.method} ${req.path}`, // Which API endpoint errored (e.g., "POST /api/recipes")
    timestamp: err.timestamp || new Date().toISOString(), // When error occurred
  });

  // ========== HANDLE APPEROR INSTANCES ==========
  // If error is an AppError (our custom error), use it directly
  if (err instanceof AppError) {
    // Use AppError's toJSON() method to format response
    // Pass true if development to include stack trace, false (production) to hide it
    return res
      .status(err.statusCode) // Set HTTP status code from error
      .json(err.toJSON(process.env.NODE_ENV === "development")); // Send formatted error
  }

  // ========== HANDLE OTHER ERROR TYPES ==========
  // If error is NOT an AppError (unexpected error, database error, etc)
  // Try to figure out what kind of error it is and create AppError

  let statusCode = 500; // Default: 500 Internal Server Error
  let code = "INTERNAL_ERROR"; // Default error code
  let details = null; // No extra details

  // ========== ERROR MESSAGE PATTERN MATCHING ==========
  // Try to determine error type by looking at error message

  // Pattern: "not found" or "does not exist" → 404 Not Found
  if (
    err.message.includes("not found") ||
    err.message.includes("does not exist")
  ) {
    statusCode = 404;
    code = "NOT_FOUND";
  }
  // Pattern: "required", "invalid", "must be" → 400 Bad Request
  else if (
    err.message.includes("required") ||
    err.message.includes("invalid") ||
    err.message.includes("must be")
  ) {
    statusCode = 400;
    code = "BAD_REQUEST";
  }
  // Pattern: "not authorized", "cannot", "not allowed" → 403 Forbidden
  else if (
    err.message.includes("not authorized") ||
    err.message.includes("cannot") ||
    err.message.includes("not allowed")
  ) {
    statusCode = 403;
    code = "FORBIDDEN";
  }
  // Pattern: "already", "duplicate" → 409 Conflict
  else if (
    err.message.includes("already") ||
    err.message.includes("duplicate")
  ) {
    statusCode = 409;
    code = "CONFLICT";
  }
  // If error has statusCode property, use it
  else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // ========== CREATE APPEROR FROM GENERIC ERROR ==========
  // Convert the non-AppError exception to AppError for consistency
  const appError = new AppError(
    err.message || "Something went wrong", // Use original error message or default
    statusCode, // Status code we determined
    code, // Error code we determined
    details, // Details (if any)
  );

  // ========== SEND CONSISTENT ERROR RESPONSE ==========
  // Send formatted error response to client
  res
    .status(statusCode) // HTTP status
    .json(appError.toJSON(process.env.NODE_ENV === "development")); // Formatted JSON
  // Include stack trace in development for debugging, hide in production for security
};

// ========== EXPORT ERROR MIDDLEWARE ==========
// Export so app.js can register it as the last middleware
module.exports = errorMiddleware;
