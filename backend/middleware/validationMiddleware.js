const validator = require("validator");

// ========== EMAIL VALIDATION ==========
const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return validator.isEmail(email);
};

// ========== PASSWORD VALIDATION ==========
// Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number
const validatePassword = (password) => {
  if (!password || typeof password !== "string" || password.length < 8) {
    return false;
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasUpperCase && hasLowerCase && hasDigit;
};

// ========== TEXT VALIDATION (Sanitize) ==========
// Remove dangerous characters, escape HTML
const sanitizeText = (text, maxLength = 500) => {
  if (!text || typeof text !== "string") return "";
  let sanitized = validator.trim(text);
  sanitized = validator.escape(sanitized);
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
};

// ========== URL VALIDATION & SANITIZATION ==========
const validateAndSanitizeUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!validator.isURL(url)) return null;
  return validator.trim(url);
};

// ========== MONGO ID VALIDATION ==========
const validateMongoId = (id) => {
  return validator.isMongoId(id);
};

// ========== INPUT VALIDATION MIDDLEWARE ==========
const validateUserInput = (req, res, next) => {
  // Sanitize common fields
  if (req.body.email) {
    if (!validateEmail(req.body.email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "Invalid email format",
        details: { field: "email" },
      });
    }
    req.body.email = validator.normalizeEmail(req.body.email);
  }

  if (req.body.password && req.body.password.length > 0) {
    if (!validatePassword(req.body.password)) {
      return res.status(400).json({
        success: false,
        error: "WEAK_PASSWORD",
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
        details: { field: "password" },
      });
    }
  }

  if (req.body.name) {
    req.body.name = sanitizeText(req.body.name, 100);
  }

  if (req.body.description) {
    req.body.description = sanitizeText(req.body.description, 1000);
  }

  if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
    req.body.ingredients = req.body.ingredients.map((ing) =>
      sanitizeText(ing, 200),
    );
  }

  if (req.body.instructions && Array.isArray(req.body.instructions)) {
    req.body.instructions = req.body.instructions.map((inst) =>
      sanitizeText(inst, 500),
    );
  }

  // Validate URL fields
  if (req.body.image) {
    const validUrl = validateAndSanitizeUrl(req.body.image);
    if (!validUrl) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "Invalid image URL",
        details: { field: "image" },
      });
    }
    req.body.image = validUrl;
  }

  next();
};

// ========== MONGO ID VALIDATION MIDDLEWARE ==========
const validateMongoIdParams = (paramNames = []) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      if (id && !validateMongoId(id)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_INPUT",
          message: `Invalid ${paramName} format`,
          details: { param: paramName },
        });
      }
    }
    next();
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeText,
  validateAndSanitizeUrl,
  validateMongoId,
  validateUserInput,
  validateMongoIdParams,
};
