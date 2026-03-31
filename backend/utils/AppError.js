/**
 * AppError - Centralized Error Class
 * Standardized error handling across the application
 */

class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details = null,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Predefined error types for common use cases
   */
  static badRequest(message, code = "BAD_REQUEST", details = null) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message, code = "UNAUTHORIZED", details = null) {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message, code = "FORBIDDEN", details = null) {
    return new AppError(message, 403, code, details);
  }

  static notFound(message, code = "NOT_FOUND", details = null) {
    return new AppError(message, 404, code, details);
  }

  static conflict(message, code = "CONFLICT", details = null) {
    return new AppError(message, 409, code, details);
  }

  static serverError(message, code = "INTERNAL_ERROR", details = null) {
    return new AppError(message, 500, code, details);
  }

  /**
   * Convert to JSON response
   */
  toJSON(includeStack = false) {
    return {
      success: false,
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(includeStack && { stack: this.stack.split("\n") }),
      timestamp: this.timestamp,
    };
  }
}

module.exports = AppError;
