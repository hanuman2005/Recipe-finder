/**
 * Auth Service
 * Handles authentication logic: login, signup, token verification
 */

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const AppError = require("../utils/AppError");

class AuthService {
  /**
   * Register new user
   */
  async register(email, password, name) {
    // Validation
    if (!email || !password || !name) {
      throw AppError.badRequest(
        "Email, password, and name are required",
        "MISSING_FIELDS",
        { fields: ["email", "password", "name"] },
      );
    }

    // Check if email valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest("Invalid email format", "INVALID_EMAIL", {
        email,
      });
    }

    // Check password strength
    if (password.length < 6) {
      throw AppError.badRequest(
        "Password must be at least 6 characters",
        "PASSWORD_TOO_SHORT",
        { minLength: 6, provided: password.length },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw AppError.conflict(
        "Email already registered",
        "EMAIL_ALREADY_EXISTS",
        { email },
      );
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = this._generateTokens(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Validation
    if (!email || !password) {
      throw AppError.badRequest(
        "Email and password are required",
        "MISSING_CREDENTIALS",
        { fields: ["email", "password"] },
      );
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { email });
    }

    // Verify password
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw AppError.unauthorized("Invalid credentials", "INVALID_PASSWORD", {
        email,
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = this._generateTokens(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw AppError.unauthorized("Invalid or expired token", "INVALID_TOKEN", {
        error: error.message,
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, oldPassword, newPassword) {
    // Validation
    if (!oldPassword || !newPassword) {
      throw AppError.badRequest(
        "Old and new passwords are required",
        "MISSING_PASSWORDS",
        { fields: ["oldPassword", "newPassword"] },
      );
    }

    if (newPassword.length < 6) {
      throw AppError.badRequest(
        "New password must be at least 6 characters",
        "PASSWORD_TOO_SHORT",
        { minLength: 6 },
      );
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Verify old password
    const isPasswordCorrect = await bcryptjs.compare(
      oldPassword,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw AppError.unauthorized(
        "Old password is incorrect",
        "INVALID_OLD_PASSWORD",
      );
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);

    await user.save();

    return { message: "Password changed successfully" };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw AppError.unauthorized(
        "No refresh token provided",
        "NO_REFRESH_TOKEN",
      );
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw AppError.notFound("User not found", "USER_NOT_FOUND");
      }

      const tokens = this._generateTokens(user._id);
      return tokens;
    } catch (error) {
      throw AppError.unauthorized(
        "Invalid or expired refresh token",
        "INVALID_REFRESH_TOKEN",
      );
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  _generateTokens(userId) {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m", // 15 minutes
    });

    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_SECRET, {
      expiresIn: process.env.REFRESH_EXPIRES_IN || "7d", // 7 days
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}

module.exports = new AuthService();
