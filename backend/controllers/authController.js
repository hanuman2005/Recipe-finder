/**
 * Auth Controller
 * Handles HTTP requests for authentication
 */

const authService = require("../services/authService");
const { queueEmail } = require("../jobs/emailProcessor");
const { sendError, sendSuccess } = require("../utils/responseHandler");

/**
 * POST /api/auth/signup
 */
exports.registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const result = await authService.register(email, password, name);

    // Send refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Queue welcome email (background job - doesn't block response)
    queueEmail(email, "welcome", { userName: name }).catch((err) => {
      console.error("Failed to queue welcome email:", err.message);
    });

    sendSuccess(res, 201, "User registered successfully", {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    sendError(res, 400, "REGISTRATION_FAILED", error.message, { email });
  }
};

/**
 * POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    // Send refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, 200, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    sendError(res, 401, "LOGIN_FAILED", error.message, { email });
  }
};

/**
 * POST /api/auth/logout
 * Protected route
 */
exports.logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Clear access token from client side (client responsibility)
    sendSuccess(res, 200, "Logout successful");
  } catch (error) {
    sendError(res, 400, "LOGOUT_FAILED", error.message);
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    // Get refresh token from httpOnly cookie
    const { refreshToken } = req.cookies;

    const tokens = await authService.refreshAccessToken(refreshToken);

    // Update refresh token cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, 200, "Token refreshed successfully", {
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    sendError(res, 401, "TOKEN_REFRESH_FAILED", error.message);
  }
};

/**
 * POST /api/auth/change-password
 * Protected route
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      userId,
      oldPassword,
      newPassword,
    );

    sendSuccess(res, 200, result.message);
  } catch (error) {
    sendError(res, 400, "PASSWORD_CHANGE_FAILED", error.message);
  }
};
