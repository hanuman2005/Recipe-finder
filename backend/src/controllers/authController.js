// ========== AUTHENTICATION CONTROLLER - HTTP REQUEST HANDLERS ==========
// Handles all HTTP requests for authentication endpoints
// Responsibility: Parse request → Call service → Set cookies → Format response
// Does NOT contain business logic (that's in authService.js)

// Import business logic layer (service)
const authService = require("../services/authService");
// Import background job queues
const { queueEmail } = require("../jobs/emailProcessor"); // Email sending jobs
// Import response formatting utilities
const { sendError, sendSuccess } = require("../utils/responseHandler");

// ========== AUTHENTICATION OPERATIONS ==========

/**
 * HANDLER: POST /api/auth/signup
 * Register new user account
 * Creates account with email, password, name
 * Sets httpOnly cookie with refresh token for session management
 * Queues welcome email (background job)
 * @route POST /api/auth/signup
 * @body {String} email - User's email (required, unique)
 * @body {String} password - User's password (required, 6+ chars)
 * @body {String} name - User's display name (required)
 * @returns {201} User object and access token (refresh token in cookie)
 * @returns {400} If validation fails or email already exists
 */
exports.registerUser = async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password, name } = req.body;

    // Call service layer to create account
    // Returns: {user, accessToken, refreshToken}
    const result = await authService.register(email, password, name);

    // ========== SET REFRESH TOKEN AS COOKIE ==========
    // httpOnly: Cannot be accessed by JavaScript (prevents XSS attacks)
    // secure: Only sent over HTTPS (prevents MITM attacks)
    // sameSite: Prevents CSRF attacks
    // maxAge: Cookie expires in 7 days (matches refresh token expiry)
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true, // Cannot access from client-side JavaScript
      secure: process.env.NODE_ENV === "production", // Only over HTTPS in production
      sameSite: "strict", // Cross-site request protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // ========== QUEUE WELCOME EMAIL (BACKGROUND JOB) ==========
    // Non-blocking: email job runs independently, doesn't delay response
    queueEmail(email, "welcome", { userName: name }).catch((err) => {
      // Log error but don't fail the request
      console.error("Failed to queue welcome email:", err.message);
    });

    // ========== SEND RESPONSE ==========
    // Status 201: Created (new resource created)
    // Return user info + access token (refresh token is in secure cookie)
    sendSuccess(res, 201, "User registered successfully", {
      user: result.user, // {_id, name, email}
      accessToken: result.accessToken, // Short-lived token (15m) for API requests
      // refreshToken NOT returned (it's in the httpOnly cookie)
    });
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "REGISTRATION_FAILED", error.message, { email });
  }
};

/**
 * HANDLER: POST /api/auth/login
 * Authenticate user and create session
 * Verifies email and password, generates tokens
 * Sets httpOnly cookie with refresh token for session management
 * @route POST /api/auth/login
 * @body {String} email - User's email (required)
 * @body {String} password - User's password (required)
 * @returns {200} User object and access token (refresh token in cookie)
 * @returns {400} If email or password missing
 * @returns {401} If credentials invalid
 */
exports.loginUser = async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Call service layer to verify credentials and generate tokens
    // Returns: {user, accessToken, refreshToken}
    const result = await authService.login(email, password);

    // ========== SET REFRESH TOKEN AS COOKIE ==========
    // Same security settings as registration
    // httpOnly: Cannot be accessed by JavaScript (prevents XSS attacks)
    // secure: Only sent over HTTPS (prevents MITM attacks)
    // sameSite: Prevents CSRF attacks
    // maxAge: Cookie expires in 7 days
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true, // Cannot access from client-side JavaScript
      secure: process.env.NODE_ENV === "production", // Only over HTTPS in production
      sameSite: "strict", // Cross-site request protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // ========== SEND RESPONSE ==========
    // Status 200: OK
    // Return user info + access token
    sendSuccess(res, 200, "Login successful", {
      user: result.user, // {_id, name, email}
      accessToken: result.accessToken, // Short-lived token (15m) for API requests
      // refreshToken NOT returned (it's in the httpOnly cookie)
    });
  } catch (error) {
    // Error response: unauthorized (401)
    sendError(res, 401, "LOGIN_FAILED", error.message, { email });
  }
};

/**
 * HANDLER: POST /api/auth/logout
 * Logout user by clearing session
 * Clears refresh token cookie (access token cleared client-side)
 * @route POST /api/auth/logout
 * @requires Authentication (JWT token - though not always checked)
 * @returns {200} Success message
 */
exports.logout = async (req, res) => {
  try {
    // ========== CLEAR REFRESH TOKEN COOKIE ==========
    // Remove refresh token cookie to invalidate session
    // Use same settings as creation to ensure cookie matches and gets removed
    res.clearCookie("refreshToken", {
      httpOnly: true, // Match creation settings exactly
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // ========== SEND RESPONSE ==========
    // Client-side responsibility: Clear access token from localStorage/state
    // (We cannot access client-side storage from the server)
    sendSuccess(res, 200, "Logout successful");
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "LOGOUT_FAILED", error.message);
  }
};

/**
 * HANDLER: POST /api/auth/refresh
 * Refresh access token using refresh token
 * When access token expires (15m), use refresh token to get new one
 * Generates new access token + new refresh token
 * @route POST /api/auth/refresh
 * @cookie {String} refreshToken - httpOnly cookie from previous login
 * @returns {200} New access token (new refresh token in cookie)
 * @returns {401} If refresh token invalid or expired
 */
exports.refreshToken = async (req, res) => {
  try {
    // ========== EXTRACT REFRESH TOKEN FROM COOKIE ==========
    // Refresh token stored in httpOnly cookie from login/signup
    const { refreshToken } = req.cookies;

    // ========== CALL SERVICE ==========
    // Service verifies refresh token and generates new tokens
    // Returns: {accessToken, refreshToken}
    const tokens = await authService.refreshAccessToken(refreshToken);

    // ========== UPDATE REFRESH TOKEN COOKIE ==========
    // Set new refresh token (old one may be approaching expiry)
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true, // Cannot access from client-side JavaScript
      secure: process.env.NODE_ENV === "production", // Only over HTTPS in production
      sameSite: "strict", // Cross-site request protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds (fresh 7d)
    });

    // ========== SEND RESPONSE ==========
    // Return new access token (new refresh token is in cookie)
    sendSuccess(res, 200, "Token refreshed successfully", {
      accessToken: tokens.accessToken, // New short-lived token (15m)
      // refreshToken NOT returned (it's in the new httpOnly cookie)
    });
  } catch (error) {
    // Error response: unauthorized (401)
    sendError(res, 401, "TOKEN_REFRESH_FAILED", error.message);
  }
};

/**
 * HANDLER: POST /api/auth/change-password
 * Change authenticated user's password
 * Verifies old password before allowing change
 * @route POST /api/auth/change-password
 * @requires Authentication (JWT token, req.user._id)
 * @body {String} oldPassword - Current password (required)
 * @body {String} newPassword - New password (required, 6+ chars)
 * @returns {200} Success message
 * @returns {400} If old password wrong or new password too weak
 */
exports.changePassword = async (req, res) => {
  try {
    // ========== EXTRACT DATA ==========
    // Get authenticated user's ID from JWT token
    const userId = req.user._id;
    // Extract passwords from request body
    const { oldPassword, newPassword } = req.body;

    // ========== CALL SERVICE ==========
    // Service verifies old password and updates to new password
    // Returns: {message: "Password changed successfully"}
    const result = await authService.changePassword(
      userId,
      oldPassword,
      newPassword,
    );

    // ========== SEND RESPONSE ==========
    // Success response with message
    sendSuccess(res, 200, result.message);
  } catch (error) {
    // Error response: bad request (400)
    sendError(res, 400, "PASSWORD_CHANGE_FAILED", error.message);
  }
};
