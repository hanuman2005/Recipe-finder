/**
 * Response Handler Utilities
 * Centralized functions for sending consistent API responses
 *
 * Usage:
 * sendSuccess(res, 200, "Recipe retrieved", recipe);
 * sendError(res, 400, "INVALID_INPUT", "Email is required");
 */

/**
 * Send consistent error response
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code (e.g., "INVALID_EMAIL")
 * @param {string} message - Human-readable error message
 * @param {object} details - Additional error details (optional)
 *
 * @example
 * sendError(res, 400, "MISSING_FIELD", "Email is required", { field: "email" });
 *
 * Response:
 * {
 *   success: false,
 *   error: "MISSING_FIELD",
 *   message: "Email is required",
 *   details: { field: "email" },
 *   timestamp: "2026-03-20T10:30:00.000Z"
 * }
 */
const sendError = (res, statusCode, errorCode, message, details = {}) => {
  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message: message,
    ...(Object.keys(details).length > 0 && { details }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send consistent success response
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {object} data - Response data (optional)
 *
 * @example
 * sendSuccess(res, 200, "Recipe retrieved successfully", recipe);
 *
 * Response:
 * {
 *   success: true,
 *   message: "Recipe retrieved successfully",
 *   data: { _id: "...", title: "Pasta", ... },
 *   timestamp: "2026-03-20T10:30:00.000Z"
 * }
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  res.status(statusCode).json({
    success: true,
    message: message,
    ...(Object.keys(data).length > 0 && { data }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send response with pagination
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {array} data - Array of items
 * @param {object} pagination - Pagination info { page, limit, total, pages }
 *
 * @example
 * sendPaginated(res, 200, "Recipes retrieved", recipes, {
 *   page: 1,
 *   limit: 10,
 *   total: 150,
 *   pages: 15
 * });
 */
const sendPaginated = (res, statusCode, message, data, pagination) => {
  res.status(statusCode).json({
    success: true,
    message: message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendError,
  sendSuccess,
  sendPaginated,
};
