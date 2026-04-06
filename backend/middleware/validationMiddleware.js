// ========== VALIDATION & SANITIZATION MIDDLEWARE ==========
// Validates and sanitizes user input to prevent:
// 1. Invalid data format (wrong email, weak password, etc)
// 2. SQL injection & XSS attacks (escaping HTML, removing dangerous chars)
// 3. Data type mismatches (ensure ID is valid MongoDB ID, etc)

// Import validation library (checks email format, URLs, sanitizes text, etc)
const validator = require("validator"); // Library with built-in validators
const { ZodError } = require("zod"); // Error type from Zod schema validation
const AppError = require("../utils/AppError"); // Custom error class

// ========== VALIDATION FUNCTIONS ==========
// These functions validate individual fields

/**
 * FUNCTION: Validate email format
 * Checks if email is properly formatted (must have @ and domain)
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid email format, false otherwise
 */
const validateEmail = (email) => {
  // Must exist, must be a string, must pass email regex check
  if (!email || typeof email !== "string") return false;
  // validator.isEmail() checks for proper email format
  return validator.isEmail(email);
};

/**
 * FUNCTION: Validate password strength
 * Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number
 * Prevents weak passwords that can be brute-forced
 * @param {String} password - Password to validate
 * @returns {Boolean} True if password meets requirements
 */
const validatePassword = (password) => {
  // Must exist, must be string, must be at least 8 characters
  if (!password || typeof password !== "string" || password.length < 8) {
    return false;
  }

  // Check for uppercase letter (A-Z)
  const hasUpperCase = /[A-Z]/.test(password);
  // Check for lowercase letter (a-z)
  const hasLowerCase = /[a-z]/.test(password);
  // Check for digit (0-9)
  const hasDigit = /\d/.test(password);

  // All three must be present
  return hasUpperCase && hasLowerCase && hasDigit;
};

/**
 * FUNCTION: Sanitize text input
 * Removes dangerous characters, trims whitespace, escapes HTML
 * Prevents XSS attacks where user could inject malicious code
 * @param {String} text - Text to sanitize
 * @param {Number} maxLength - Max allowed length (default: 500) - truncates if longer
 * @returns {String} Sanitized text
 */
const sanitizeText = (text, maxLength = 500) => {
  // If no text or not a string, return empty
  if (!text || typeof text !== "string") return "";

  // Trim whitespace from start/end
  let sanitized = validator.trim(text);

  // Escape HTML characters: < becomes &lt;, > becomes &gt;, etc
  // Prevents <script> tags and other HTML injection
  sanitized = validator.escape(sanitized);

  // Truncate if longer than maxLength
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * FUNCTION: Validate and sanitize URLs
 * Ensures URL is properly formatted and absolute (not relative)
 * @param {String} url - URL to validate
 * @returns {String|null} Trimmed URL if valid, null otherwise
 */
const validateAndSanitizeUrl = (url) => {
  // Must exist and be string
  if (!url || typeof url !== "string") return null;

  // Check if it's a valid URL (http://, https://,etc)
  if (!validator.isURL(url)) return null;

  // Trim and return
  return validator.trim(url);
};

/**
 * FUNCTION: Validate MongoDB ObjectID format
 * MongoDB IDs must be 24-character hexadecimal strings
 * @param {String} id - ID to validate
 * @returns {Boolean} True if valid MongoDB ID format
 */
const validateMongoId = (id) => {
  return validator.isMongoId(id);
};

// ========== ZOD SCHEMA VALIDATION MIDDLEWARE FACTORY ==========
/**
 * MIDDLEWARE FACTORY: Validates request body against Zod schema
 * Used with Zod validation: const schema = z.object({email: z.string().email(), ...})
 * Usage: app.post('/register', validate(userRegisterSchema), controller)
 *
 * @param {ZodSchema} schema - Zod validation schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate req.body against schema
      // parseAsync() validates and throws ZodError if fails
      const validatedData = await schema.parseAsync(req.body);

      // Replace req.body with validated/transformed data from schema
      // (Zod can transform data: toLowercase(), trim(), etc)
      req.body = validatedData;

      // Continue to next middleware
      next();
    } catch (error) {
      // If it's a Zod validation error
      if (error instanceof ZodError) {
        // Format errors into readable array with field names and messages
        const errors = error.errors.map((err) => ({
          field: err.path.join("."), // "email", "password", etc
          message: err.message, // "Invalid email format", etc
        }));

        // Pass AppError to error middleware
        return next(
          new AppError("Validation failed", 400, {
            details: errors,
          }),
        );
      }

      // If some other error, pass it along
      next(error);
    }
  };
};

/**
 * MIDDLEWARE FACTORY: Validates query parameters against Zod schema
 * Similar to validate() but for req.query (URL parameters)
 * Usage: app.get('/recipes?page=1&limit=10', validateQuery(querySchema), controller)
 *
 * @param {ZodSchema} schema - Zod schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate req.query against schema
      const validatedData = await schema.parseAsync(req.query);
      // Replace with validated data
      req.query = validatedData;
      next();
    } catch (error) {
      // Format Zod errors
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return next(
          new AppError("Invalid query parameters", 400, {
            details: errors,
          }),
        );
      }

      next(error);
    }
  };
};

/**
 * MIDDLEWARE FACTORY: Validates URL parameters against Zod schema
 * For /api/recipes/:id type routes
 * Usage: app.get('/recipes/:id', validateParams(paramsSchema), controller)
 *
 * @param {ZodSchema} schema - Zod schema for URL params
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate req.params against schema
      const validatedData = await schema.parseAsync(req.params);
      // Replace with validated data
      req.params = validatedData;
      next();
    } catch (error) {
      // Format Zod errors
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return next(
          new AppError("Invalid URL parameters", 400, {
            details: errors,
          }),
        );
      }

      next(error);
    }
  };
};

// ========== LEGACY VALIDATION MIDDLEWARE ==========
/**
 * MIDDLEWARE: validateUserInput (deprecated - use Zod instead)
 * Sanitizes common user input fields (email, password, name, etc)
 * Also validates format
 */
const validateUserInput = (req, res, next) => {
  // ========== EMAIL VALIDATION & NORMALIZATION ==========
  if (req.body.email) {
    // Check email format
    if (!validateEmail(req.body.email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "Invalid email format",
        details: { field: "email" },
      });
    }
    // Normalize email: lowercase, remove dots before @, etc
    // (Different email providers interpret differently)
    req.body.email = validator.normalizeEmail(req.body.email);
  }

  // ========== PASSWORD VALIDATION ==========
  if (req.body.password && req.body.password.length > 0) {
    // Check password strength
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

  // ========== TEXT FIELD SANITIZATION ==========
  // Name: sanitize and limit to 100 chars
  if (req.body.name) {
    req.body.name = sanitizeText(req.body.name, 100);
  }

  // Description: sanitize and limit to 1000 chars
  if (req.body.description) {
    req.body.description = sanitizeText(req.body.description, 1000);
  }

  // Ingredients: sanitize each ingredient
  if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
    req.body.ingredients = req.body.ingredients.map((ing) =>
      sanitizeText(ing, 200),
    );
  }

  // Instructions: sanitize each instruction step
  if (req.body.instructions && Array.isArray(req.body.instructions)) {
    req.body.instructions = req.body.instructions.map((inst) =>
      sanitizeText(inst, 500),
    );
  }

  // ========== URL VALIDATION ==========
  if (req.body.image) {
    // Validate and sanitize image URL
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

  // All validations passed, continue
  next();
};

// ========== MONGO ID VALIDATION MIDDLEWARE FACTORY (LEGACY) ==========
/**
 * MIDDLEWARE FACTORY: Validates that requested param IDs are valid MongoDB IDs
 * Usage: app.get('/recipes/:id', validateMongoIdParams(['id']), controller)
 *
 * @param {Array<String>} paramNames - Names of URL params to validate (e.g., ['id', 'userId'])
 * @returns {Function} Express middleware
 */
const validateMongoIdParams = (paramNames = []) => {
  return (req, res, next) => {
    // Check each param name provided
    for (const paramName of paramNames) {
      // Get the value from req.params
      const id = req.params[paramName];

      // If it exists and is not a valid MongoDB ID
      if (id && !validateMongoId(id)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_INPUT",
          message: `Invalid ${paramName} format`,
          details: { param: paramName },
        });
      }
    }

    // All IDs valid, continue
    next();
  };
};

// ========== EXPORT ALL VALIDATION FUNCTIONS & MIDDLEWARE ==========
// Export so routes and controllers can use these
module.exports = {
  validateEmail, // Function: validate email format
  validatePassword, // Function: validate password strength
  sanitizeText, // Function: sanitize and trim text
  validateAndSanitizeUrl, // Function: validate URLs
  validateMongoId, // Function: validate MongoDB ID format
  validateUserInput, // Middleware: sanitize common fields
  validateMongoIdParams, // Middleware factory: validate URL param IDs
  validate, // Middleware factory: validate body with Zod schema
  validateQuery, // Middleware factory: validate query with Zod schema
  validateParams, // Middleware factory: validate URL params with Zod schema
};
