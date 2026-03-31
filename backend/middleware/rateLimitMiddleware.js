const rateLimit = require("express-rate-limit");

// Helper function to safely get IP address
const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

// ========== GENERAL RATE LIMITER ==========
// Limit: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req), // Use IP as key
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path.startsWith("/health") || req.path.startsWith("/live");
  },
});

// ========== AUTH RATE LIMITER ==========
// Stricter: 5 login/register attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts
  message: "Too many auth attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "AUTH_RATE_LIMIT_EXCEEDED",
      message:
        "Too many login/register attempts. Please try again in 15 minutes.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// ========== CREATE/DELETE RATE LIMITER ==========
// Moderate: 30 create/delete requests per 15 minutes
const createDeleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if logged in, otherwise use IP
    return req.user?._id?.toString() || getClientIp(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "RESOURCE_LIMIT_EXCEEDED",
      message: "Too many resource modifications. Please try again later.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// ========== SEARCH RATE LIMITER ==========
// Loose: 60 search requests per minute
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: "Too many search requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if logged in, otherwise use IP
    return req.user?._id?.toString() || getClientIp(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "SEARCH_LIMIT_EXCEEDED",
      message: "Too many search requests. Please slow down.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  createDeleteLimiter,
  searchLimiter,
};
