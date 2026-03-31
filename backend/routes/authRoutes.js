const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  refreshToken,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const { validateUserInput } = require("../middleware/validationMiddleware");

const router = express.Router();

// POST /api/auth/register - Register new user
router.post("/register", authLimiter, validateUserInput, registerUser);

// POST /api/auth/login - Login user
router.post("/login", authLimiter, validateUserInput, loginUser);

// POST /api/auth/refresh - Refresh access token
router.post("/refresh", refreshToken);

// POST /api/auth/logout - Logout user (Protected)
router.post("/logout", protect, logout);

// POST /api/auth/change-password - Change password (Protected)
router.post("/change-password", protect, changePassword);

module.exports = router;
