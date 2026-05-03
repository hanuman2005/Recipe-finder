// ========== RATE LIMITING MIDDLEWARE ==========
// Prevents abuse by limiting how many requests per IP/user in a time period
// Protects against brute force attacks, DoS attacks, spam
// express-rate-limit library handles the counting and blocking

// Import rate limiter library
const rateLimit = require("express-rate-limit"); // npm package for rate limiting

/**
 * HELPER FUNCTION: Get client IP address
 * Tries multiple methods because IP can be in different places depending on setup
 * (direct connection vs behind proxy vs load balancer)
 * @returns {String} Client IP address or "unknown"
 */
const getClientIp = (req) => {
  // Try different ways to get IP address (order matters - more reliable first)
  return (
    req.ip || // From req.ip (most direct)
    req.connection.remoteAddress || // From connection object
    req.socket.remoteAddress || // From socket object
    "unknown" // Default if none work
  );
};

// ========== GENERAL RATE LIMITER ==========
// Applied to all routes via app.use()
// Limit: 100 requests per 15 minutes per IP
// Purpose: Basic protection against excessive requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds (11.25 seconds per request max)
  max: 100, // Maximum 100 requests per window
  message: "Too many requests, please try again later", // Message in body if limit hit
  standardHeaders: true, // Include rate limit info in response headers (RateLimit-*)
  legacyHeaders: false, // Don't include X-RateLimit-* headers (older format)
  keyGenerator: (req) => getClientIp(req), // Use client IP as the key for tracking
  // Handler: what to do when limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      // 429 = Too Many Requests
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
      retryAfter: req.rateLimit.resetTime, // When we can try again
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints (shouldn't count toward limit)
    return req.path.startsWith("/health") || req.path.startsWith("/live");
  },
});

// ========== AUTH RATE LIMITER ==========
// Applied to /api/auth/login and /api/auth/register
// Stricter limit: 5 login/register attempts per 15 minutes per IP
// Purpose: Prevent brute force password attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts - very strict
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
// Applied to create/delete recipe, user delete, etc
// Moderate limit: 30 create/delete per 15 minutes
// Purpose: Prevent bulk deletion/creation spam
const createDeleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 operations max
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if logged in (more accurate tracking), otherwise use IP
  keyGenerator: (req) => {
    // Optional chaining: req.user?._id?.toString() is safe even if user doesn't exist
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
// Applied to search endpoints
// Loose limit: 60 search requests per 1 minute
// Purpose: Prevent search spam (searching can be resource-intensive with full-text search)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute (shorter window than others)
  max: 60, // 60 searches per minute (1 per second)
  message: "Too many search requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if logged in, otherwise IP address
  keyGenerator: (req) => {
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

// ========== EXPORT ALL LIMITERS ==========
// Export so auth routes can use authLimiter, recipe routes can use createDeleteLimiter, etc
module.exports = {
  generalLimiter, // Applied globally to all routes
  authLimiter, // Applied to login/register
  createDeleteLimiter, // Applied to create/delete operations
  searchLimiter, // Applied to search endpoints
};
