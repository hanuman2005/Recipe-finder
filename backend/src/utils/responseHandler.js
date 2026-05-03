// ========== RESPONSE HANDLER UTILITIES ==========
// Centralized functions for sending consistent API responses
// Ensures all success/error responses follow the same format
// Frontend can rely on consistent structure for every API call

/**
 * FUNCTION: Send consistent error response
 * Used when an error occurs and we need to inform the client
 *
 * @param {Express.Response} res - Express response object (for sending data back to client)
 * @param {Number} statusCode - HTTP status code (400, 401, 404, 500, etc)
 * @param {String} errorCode - Machine-readable error code (e.g., "INVALID_EMAIL", "USER_NOT_FOUND")
 * @param {String} message - Human-readable error message shown to user
 * @param {Object} details - Optional additional error context (field names, values, etc) - default: {}
 *
 * @example
 * // Usage in controller:
 * sendError(res, 400, "MISSING_FIELD", "Email is required", { field: "email" });
 *
 * // Response sent to client:
 * {
 *   success: false,          // Indicates request failed
 *   error: "MISSING_FIELD",  // Code for frontend to handle programmatically
 *   message: "Email is required", // Message to show user
 *   details: { field: "email" },  // Extra debugging info
 *   timestamp: "2026-03-20T10:30:00.000Z" // When error occurred
 * }
 */
const sendError = (res, statusCode, errorCode, message, details = {}) => {
  // Set HTTP status code (tells client what type of error: 400, 401, 404, etc)
  res.status(statusCode).json({
    success: false, // Flag indicating this is an error response
    error: errorCode, // Code for frontend to detect and handle specific errors
    message: message, // Message to display to user
    // Spread details only if it has content (won't add empty details object)
    ...(Object.keys(details).length > 0 && { details }),
    timestamp: new Date().toISOString(), // ISO timestamp of when error occurred
  });
};

/**
 * FUNCTION: Send consistent success response
 * Used when request succeeds and we return data to client
 *
 * @param {Express.Response} res - Express response object
 * @param {Number} statusCode - HTTP status code (200, 201, 204, etc)
 * @param {String} message - Success message (e.g., "Recipe created successfully")
 * @param {Object} data - Response data to send back to client - default: {}
 *
 * @example
 * // Usage in controller:
 * sendSuccess(res, 200, "Recipe retrieved successfully", recipe);
 *
 * // Response sent to client:
 * {
 *   success: true,  // Indicates request succeeded
 *   message: "Recipe retrieved successfully", // Confirmation message
 *   data: {         // The actual data requested
 *     _id: "6407d451e123456789abc001",
 *     title: "Pasta Carbonara",
 *     description: "Classic Italian pasta...",
 *     ... more recipe fields ...
 *   },
 *   timestamp: "2026-03-20T10:30:00.000Z" // When response created
 * }
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  // Set HTTP status code (200 = OK, 201 = Created, etc)
  res.status(statusCode).json({
    success: true, // Flag indicating this is success response
    message: message, // Confirmation message
    // Spread data only if it has content (won't add empty data object)
    ...(Object.keys(data).length > 0 && { data }),
    timestamp: new Date().toISOString(), // ISO timestamp
  });
};

/**
 * FUNCTION: Send success response with pagination information
 * Used for list endpoints that return multiple items with pagination
 *
 * @param {Express.Response} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Array} data - Array of items to return (recipes, users, comments, etc)
 * @param {Object} pagination - Pagination details {page, limit, total, pages}
 *   - page: current page number (1, 2, 3, etc)
 *   - limit: items per page (10, 20, etc)
 *   - total: total items in database matching query
 *   - pages: total pages needed to display all items
 *
 * @example
 * // Usage in controller to get recipes:
 * sendPaginated(res, 200, "Recipes retrieved", recipes, {
 *   page: 1,    // Currently showing page 1
 *   limit: 10,  // 10 recipes per page
 *   total: 150, // 150 total recipes in database
 *   pages: 15   // Need 15 pages to show all (150 ÷ 10 = 15)
 * });
 *
 * // Response sent to client:
 * {
 *   success: true,
 *   message: "Recipes retrieved",
 *   data: [      // Array of recipe objects
 *     { _id: "...", title: "Pasta", ... },
 *     { _id: "...", title: "Rice", ... },
 *     ... 8 more recipes ...
 *   ],
 *   pagination: {  // Instructions for displaying pagination UI
 *     page: 1,     // Show page 1 is selected
 *     limit: 10,   // Show "10 per page"
 *     total: 150,  // Show "150 total recipes"
 *     pages: 15    // Show "15 pages total" - enable next button for pages 2-15
 *   },
 *   timestamp: "2026-03-20T10:30:00.000Z"
 * }
 */
const sendPaginated = (res, statusCode, message, data, pagination) => {
  // Set HTTP status code
  res.status(statusCode).json({
    success: true, // Success flag
    message: message, // Message
    data, // Array of items (recipes, users, etc)
    pagination, // Pagination info so frontend knows how many pages/items exist
    timestamp: new Date().toISOString(), // Timestamp
  });
};

// ========== EXPORT ALL RESPONSE FUNCTIONS ==========
// Export so controllers can import and use these consistent response functions
module.exports = {
  sendError, // For error responses
  sendSuccess, // For single-item success responses
  sendPaginated, // For list success responses with pagination
};
