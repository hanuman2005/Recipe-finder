// ========== AUTHENTICATION SERVICE - BUSINESS LOGIC LAYER ==========
// Handles all authentication operations:
// 1. User registration (signup with validation and password hashing)
// 2. User login (credentials verification with token generation)
// 3. Token management (generation, verification, refresh token handling)
// 4. Password management (validation, change, hashing)

const User = require("../models/User"); // User MongoDB model
const jwt = require("jsonwebtoken"); // JWT token generation and verification
const bcryptjs = require("bcryptjs"); // Password hashing and comparison
const AppError = require("../utils/AppError"); // Custom error class

// Singleton service instance - all auth operations go through this class
class AuthService {
  // ========== REGISTRATION & ACCOUNT CREATION ==========

  /**
   * FUNCTION: Register new user account
   * Validates email format, password strength, and checks for duplicates
   * Creates user with hashed password and generates JWT tokens
   * @param {String} email - User's email address
   * @param {String} password - User's password (must be 6+ chars)
   * @param {String} name - User's display name
   * @returns {Object} {
   *   user: {_id, name, email},
   *   accessToken: JWT (15m expiry),
   *   refreshToken: JWT (7d expiry)
   * }
   * @throws {Error} If validation fails, email exists, or DB error
   */
  async register(email, password, name) {
    // ========== VALIDATE REQUIRED FIELDS ==========
    // All three fields must be provided
    if (!email || !password || !name) {
      throw AppError.badRequest(
        "Email, password, and name are required",
        "MISSING_FIELDS",
        { fields: ["email", "password", "name"] },
      );
    }

    // ========== VALIDATE EMAIL FORMAT ==========
    // Email must contain @ symbol and domain
    // Format: something@domain.ext
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest("Invalid email format", "INVALID_EMAIL", {
        email,
      });
    }

    // ========== VALIDATE PASSWORD STRENGTH ==========
    // Password must be at least 6 characters
    // (Stronger validation with uppercase/lowercase/digits in validationMiddleware)
    if (password.length < 6) {
      throw AppError.badRequest(
        "Password must be at least 6 characters",
        "PASSWORD_TOO_SHORT",
        { minLength: 6, provided: password.length },
      );
    }

    // ========== CHECK FOR DUPLICATE EMAIL ==========
    // Email must be unique in database (no existing account)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw AppError.conflict(
        "Email already registered",
        "EMAIL_ALREADY_EXISTS",
        { email },
      );
    }

    // ========== HASH PASSWORD ==========
    // bcryptjs.genSalt(10): Generate salt with 10 rounds (higher = more secure but slower)
    // bcryptjs.hash(): Hash password + salt together
    // Result: Password cannot be reversed, only verified with bcryptjs.compare()
    const salt = await bcryptjs.genSalt(10); // Generate random salt
    const hashedPassword = await bcryptjs.hash(password, salt); // Hash with salt

    // ========== CREATE USER IN DATABASE ==========
    // Create new user with hashed password (original never stored)
    const user = new User({
      name, // Display name
      email, // Unique email
      password: hashedPassword, // One-way hashed password
    });

    // Save to database
    await user.save();

    // ========== GENERATE TOKENS ==========
    // Create both access token (short-lived) and refresh token (long-lived)
    const { accessToken, refreshToken } = this._generateTokens(user._id);

    // ========== SAVE REFRESH TOKEN TO DATABASE ==========
    // Store refresh token in user document for verification later
    // (Allows logout by invalidating token in DB)
    user.refreshToken = refreshToken;
    await user.save();

    // ========== RETURN RESPONSE ==========
    return {
      user: {
        _id: user._id, // User's unique ID
        name: user.name, // Display name
        email: user.email, // Email address
      },
      accessToken, // Short-lived token for API requests (15m)
      refreshToken, // Long-lived token for getting new access tokens (7d)
    };
  }

  // ========== LOGIN ==========

  /**
   * FUNCTION: Login existing user
   * Validates credentials and generates JWT tokens
   * @param {String} email - User's email address
   * @param {String} password - User's password (plaintext, will be verified)
   * @returns {Object} {
   *   user: {_id, name, email},
   *   accessToken: JWT (15m expiry),
   *   refreshToken: JWT (7d expiry)
   * }
   * @throws {Error} If email not found or password incorrect
   */
  async login(email, password) {
    // ========== VALIDATE REQUIRED FIELDS ==========
    // Both email and password must be provided
    if (!email || !password) {
      throw AppError.badRequest(
        "Email and password are required",
        "MISSING_CREDENTIALS",
        { fields: ["email", "password"] },
      );
    }

    // ========== FIND USER BY EMAIL ==========
    // Look up user in database by email
    const user = await User.findOne({ email });
    if (!user) {
      // Email not found in database
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { email });
    }

    // ========== VERIFY PASSWORD ==========
    // bcryptjs.compare(): Compares plaintext password with hashed password
    // Even though password is hashed, we can verify without storing original
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      // Password doesn't match stored hash
      throw AppError.unauthorized("Invalid credentials", "INVALID_PASSWORD", {
        email,
      });
    }

    // ========== GENERATE TOKENS ==========
    // Create both access token (short-lived) and refresh token (long-lived)
    const { accessToken, refreshToken } = this._generateTokens(user._id);

    // ========== SAVE REFRESH TOKEN TO DATABASE ==========
    // Store refresh token in user document for verification later
    user.refreshToken = refreshToken;
    await user.save();

    // ========== RETURN RESPONSE ==========
    return {
      user: {
        _id: user._id, // User's unique ID
        name: user.name, // Display name
        email: user.email, // Email address
      },
      accessToken, // Short-lived token for API requests (15m)
      refreshToken, // Long-lived token for getting new access tokens (7d)
    };
  }

  // ========== TOKEN VERIFICATION ==========

  /**
   * FUNCTION: Verify and decode JWT token
   * Checks token signature and expiration
   * @param {String} token - JWT token string
   * @returns {Object} Decoded token {id: userId, iat: issuedAt, exp: expiry}
   * @throws {Error} If token invalid or expired
   */
  verifyToken(token) {
    try {
      // jwt.verify(): Verifies signature using JWT_SECRET and checks expiration
      // If valid, returns decoded payload with user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      // Token either invalid, expired, or wrong secret
      throw AppError.unauthorized("Invalid or expired token", "INVALID_TOKEN", {
        error: error.message,
      });
    }
  }

  // ========== PASSWORD MANAGEMENT ==========

  /**
   * FUNCTION: Change user password
   * Verifies old password, validates new password strength, updates DB
   * @param {String} userId - User's MongoDB ID
   * @param {String} oldPassword - Current password (plaintext)
   * @param {String} newPassword - New password (plaintext, must be different)
   * @returns {Object} {message: "Password changed successfully"}
   * @throws {Error} If old password wrong or new password weak
   */
  async changePassword(userId, oldPassword, newPassword) {
    // ========== VALIDATE REQUIRED FIELDS ==========
    // Both passwords must be provided
    if (!oldPassword || !newPassword) {
      throw AppError.badRequest(
        "Old and new passwords are required",
        "MISSING_PASSWORDS",
        { fields: ["oldPassword", "newPassword"] },
      );
    }

    // ========== VALIDATE NEW PASSWORD STRENGTH ==========
    // New password must be at least 6 characters
    if (newPassword.length < 6) {
      throw AppError.badRequest(
        "New password must be at least 6 characters",
        "PASSWORD_TOO_SHORT",
        { minLength: 6 },
      );
    }

    // ========== FIND USER ==========
    // Get user document (including password field)
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== VERIFY OLD PASSWORD ==========
    // Compare provided old password with stored hash
    const isPasswordCorrect = await bcryptjs.compare(
      oldPassword,
      user.password,
    );
    if (!isPasswordCorrect) {
      // Old password doesn't match
      throw AppError.unauthorized(
        "Old password is incorrect",
        "INVALID_OLD_PASSWORD",
      );
    }

    // ========== HASH NEW PASSWORD ==========
    // bcryptjs.genSalt(10): Generate random salt
    // bcryptjs.hash(): Hash new password with salt
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);

    // ========== SAVE TO DATABASE ==========
    await user.save();

    return { message: "Password changed successfully" };
  }

  // ========== TOKEN REFRESH ==========

  /**
   * FUNCTION: Refresh access token using refresh token
   * Verifies refresh token and generates new short-lived access token
   * Used when access token expires but refresh token still valid
   * @param {String} refreshToken - User's refresh token (7d expiry)
   * @returns {Object} {
   *   accessToken: New JWT (15m expiry),
   *   refreshToken: New JWT (7d expiry)
   * }
   * @throws {Error} If refresh token missing, invalid, or expired
   */
  async refreshAccessToken(refreshToken) {
    // ========== VALIDATE REFRESH TOKEN PROVIDED ==========
    // Refresh token must exist
    if (!refreshToken) {
      throw AppError.unauthorized(
        "No refresh token provided",
        "NO_REFRESH_TOKEN",
      );
    }

    try {
      // ========== VERIFY REFRESH TOKEN ==========
      // Decode and verify refresh token using REFRESH_SECRET
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

      // ========== FIND USER ==========
      // Get user from decoded token ID
      const user = await User.findById(decoded.id);

      if (!user) {
        // User deleted or doesn't exist
        throw AppError.notFound("User not found", "USER_NOT_FOUND");
      }

      // ========== GENERATE NEW TOKENS ==========
      // Create fresh access token (15m) and refresh token (7d)
      const tokens = this._generateTokens(user._id);

      return tokens;
    } catch (error) {
      // Token verification failed (invalid signature, expired, etc)
      throw AppError.unauthorized(
        "Invalid or expired refresh token",
        "INVALID_REFRESH_TOKEN",
      );
    }
  }

  // ========== TOKEN GENERATION (PRIVATE HELPER METHOD) ==========

  /**
   * PRIVATE FUNCTION: Generate JWT access and refresh tokens
   * Creates two different tokens with different secrets and expiration times
   * @param {String} userId - User's MongoDB ID to encode in token
   * @returns {Object} {
   *   accessToken: JWT (15m expiry, for API requests),
   *   refreshToken: JWT (7d expiry, for getting new access tokens)
   * }
   *
   * Token Structure: Header.Payload.Signature
   * - Header: Token type (JWT) and algorithm (HS256)
   * - Payload: {id: userId, iat: issuedAt, exp: expiry}
   * - Signature: HMAC using secret key (ensures token not tampered)
   */
  _generateTokens(userId) {
    // ========== GENERATE ACCESS TOKEN ==========
    // Short-lived token for API requests
    // Payload: {id: userId} (user can read but not modify)
    // Signed with JWT_SECRET
    // Expires in 15 minutes
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m", // Standard: 15 minutes
    });

    // ========== GENERATE REFRESH TOKEN ==========
    // Long-lived token for requesting new access tokens
    // Payload: {id: userId}
    // Signed with REFRESH_SECRET (different key for security)
    // Expires in 7 days
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_SECRET, {
      expiresIn: process.env.REFRESH_EXPIRES_IN || "7d", // Standard: 7 days
    });

    // ========== RETURN BOTH TOKENS ==========
    return {
      accessToken, // Use for protected routes
      refreshToken, // Use to get new accessToken when it expires
    };
  }
}

// ========== SINGLETON EXPORT ==========
// Export single instance of AuthService for use throughout backend
// Usage: const service = require('./authService'); service.login(email, password)
module.exports = new AuthService();
