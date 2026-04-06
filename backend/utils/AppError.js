// ========== APPEROR - CENTRALIZED ERROR CLASS ==========
// Custom Error class for consistent error handling across entire application
// Ensures all errors have: message, HTTP status code, error code, and details
// All errors thrown from this class can be caught by errorMiddleware

// Extend built-in Error class to create custom error type
class AppError extends Error {
  /**
   * Constructor - Initialize error with all needed information
   * @param {String} message - Human-readable error message (e.g., "Recipe not found")
   * @param {Number} statusCode - HTTP status code (400, 401, 404, 500, etc) - default 500
   * @param {String} code - Machine-readable error code (e.g., "RECIPE_NOT_FOUND") - default "INTERNAL_ERROR"
   * @param {Object} details - Additional error context/debugging info (optional)
   */
  constructor(
    message, // Error message shown to user
    statusCode = 500, // HTTP status code (default: 500 Internal Server Error)
    code = "INTERNAL_ERROR", // Error code for frontend to handle programmatically
    details = null, // Extra debugging info (validation errors, field names, etc)
  ) {
    // Call parent Error constructor with message
    super(message);

    // ========== SET ERROR PROPERTIES ==========
    this.name = "AppError"; // Error type name for instanceof checks
    this.statusCode = statusCode; // HTTP status to return to client
    this.code = code; // Machine-readable error code
    this.details = details; // Additional error details for debugging
    this.timestamp = new Date().toISOString(); // When error occurred (ISO format)

    // ========== CAPTURE STACK TRACE ==========
    // Captures the call stack so we know where error was thrown
    // Improves debugging by showing which line threw the error
    Error.captureStackTrace(this, this.constructor);
  }

  // ========== STATIC HELPER METHODS ==========
  // Factory methods to quickly create specific error types
  // Usage: throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {recipeId})

  /**
   * 400 Bad Request - Invalid client input
   * User sent malformed/invalid data
   */
  static badRequest(message, code = "BAD_REQUEST", details = null) {
    // Return new AppError with 400 status
    return new AppError(message, 400, code, details);
  }

  /**
   * 401 Unauthorized - Authentication failed
   * User needs to login or token is invalid/expired
   */
  static unauthorized(message, code = "UNAUTHORIZED", details = null) {
    // Return new AppError with 401 status
    return new AppError(message, 401, code, details);
  }

  /**
   * 403 Forbidden - Authorization failed
   * User is logged in but doesn't have permission (e.g., can't delete someone else's recipe)
   */
  static forbidden(message, code = "FORBIDDEN", details = null) {
    // Return new AppError with 403 status
    return new AppError(message, 403, code, details);
  }

  /**
   * 404 Not Found - Resource doesn't exist
   * Requested recipe/user/comment not found in database
   */
  static notFound(message, code = "NOT_FOUND", details = null) {
    // Return new AppError with 404 status
    return new AppError(message, 404, code, details);
  }

  /**
   * 409 Conflict - Duplicate or conflicting data
   * Example: Trying to register with email that already exists
   */
  static conflict(message, code = "CONFLICT", details = null) {
    // Return new AppError with 409 status
    return new AppError(message, 409, code, details);
  }

  /**
   * 500 Internal Server Error - Something went wrong on server
   * Database error, unexpected exception, etc
   */
  static serverError(message, code = "INTERNAL_ERROR", details = null) {
    // Return new AppError with 500 status
    return new AppError(message, 500, code, details);
  }

  // ========== JSON CONVERSION METHOD ==========
  /**
   * Convert error to JSON response format
   * @param {Boolean} includeStack - Whether to include stack trace (default: false for production)
   * @returns {Object} JSON object with error details
   */
  toJSON(includeStack = false) {
    // Return standardized error response object
    return {
      success: false, // Indicates request failed
      statusCode: this.statusCode, // HTTP status code
      code: this.code, // Error code for frontend handling
      message: this.message, // Human-readable error message
      // Spread details if they exist (won't be included if null/undefined)
      ...(this.details && { details: this.details }),
      // Spread stack trace if requested (only in development, not production)
      ...(includeStack && { stack: this.stack.split("\n") }),
      timestamp: this.timestamp, // When error occurred
    };
  }
}

// ========== EXPORT ERROR CLASS ==========
// Export so can be used in all controllers and services
module.exports = AppError;
