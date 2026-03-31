const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Extract token

      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify with env var

      req.user = await User.findById(decoded.id).select("-password"); // Attach user to request

      if (!req.user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      next(); // Move to next middleware/controller
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Not authorized - invalid or expired token",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      error: "Not authorized - no token provided",
    });
  }
};

module.exports = { protect };
