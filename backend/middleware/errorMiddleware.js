/**
 * Centralized Error Handler Middleware
 * Catches all errors and sends consistent error responses
 */

const AppError = require("../utils/AppError");

const errorMiddleware = (err, req, res, next) => {
  // Log error for debugging
  console.error("❌ ERROR:", {
    code: err.code || "UNKNOWN_ERROR",
    message: err.message,
    statusCode: err.statusCode || 500,
    endpoint: `${req.method} ${req.path}`,
    timestamp: err.timestamp || new Date().toISOString(),
  });

  // If it's an AppError, use its properties directly
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(err.toJSON(process.env.NODE_ENV === "development"));
  }

  // Handle other error types by converting to AppError
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let details = null;

  // Try to determine status code from error message
  if (
    err.message.includes("not found") ||
    err.message.includes("does not exist")
  ) {
    statusCode = 404;
    code = "NOT_FOUND";
  } else if (
    err.message.includes("required") ||
    err.message.includes("invalid") ||
    err.message.includes("must be")
  ) {
    statusCode = 400;
    code = "BAD_REQUEST";
  } else if (
    err.message.includes("not authorized") ||
    err.message.includes("cannot") ||
    err.message.includes("not allowed")
  ) {
    statusCode = 403;
    code = "FORBIDDEN";
  } else if (
    err.message.includes("already") ||
    err.message.includes("duplicate")
  ) {
    statusCode = 409;
    code = "CONFLICT";
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // Create AppError from non-AppError exceptions
  const appError = new AppError(
    err.message || "Something went wrong",
    statusCode,
    code,
    details,
  );

  // Send consistent error response
  res
    .status(statusCode)
    .json(appError.toJSON(process.env.NODE_ENV === "development"));
};

module.exports = errorMiddleware;
