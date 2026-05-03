// ========== USER VALIDATION SCHEMAS ==========
// Defines all Zod validation schemas for user-related API endpoints
// Validates: registration, login, profile updates, password changes
// All schemas validate input types, lengths, formats, and custom constraints

// Import Zod library for building type-safe validation schemas
const { z } = require("zod");

// ========== REGISTRATION VALIDATION SCHEMA ==========
/**
 * Base schema for user registration (POST /api/auth/register)
 * Validates new user account creation data
 *
 * Fields validated:
 *   - name: String, 2-50 chars, automatically trimmed
 *   - email: Valid email format, converted to lowercase
 *   - password: Minimum 6 chars, requires uppercase + lowercase + number
 *   - confirmPassword: String (compared via .refine() below)
 *
 * Zod methods used:
 *   - .string() - Field is required string type
 *   - .min(n) - Minimum length validation
 *   - .max(n) - Maximum length validation
 *   - .trim() - Automatically removes leading/trailing whitespace
 *   - .email() - Validates email format (RFC5322 compliant)
 *   - .transform() - Transforms value (lowercase for case-insensitive matching)
 *   - .regex() - Pattern matching (password complexity check)
 */
const userRegisterSchema = z.object({
  // User's display name
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim(), // Remove whitespace automatically

  // User's email - must be valid format and unique in database
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()), // Store emails lowercase for consistency

  // User's password - must meet security requirements
  // Regex breakdown: (?=.*[a-z]) = has lowercase, (?=.*[A-Z]) = has uppercase, (?=.*\d) = has digit
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number",
    ),

  // Password confirmation for frontend UX - must match password field
  confirmPassword: z.string(),
});

/**
 * Registration validation with password confirmation check
 * Uses .refine() to add cross-field validation
 *
 * .refine() syntax: .refine(predicate, { message, path })
 *   - predicate: Function that returns true if valid, false if invalid
 *   - message: Error message shown to user
 *   - path: Which field(s) the error is associated with
 *
 * This ensures password and confirmPassword match before submission
 */
const userRegisterValidation = userRegisterSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Error shown on confirmPassword field
  },
);

// ========== LOGIN VALIDATION SCHEMA ==========
/**
 * Schema for user login (POST /api/auth/login)
 * Validates credentials for existing user account access
 *
 * Fields validated:
 *   - email: Valid email format, converted to lowercase
 *   - password: Non-empty string (strength checked during DB verification)
 *
 * Note: Password not validated for strength on login - only existence required
 * Database lookup will verify hash matches with bcryptjs.compare()
 */
const userLoginSchema = z.object({
  // Email must exist in database - checked by authService.login()
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()), // Normalize to lowercase for database lookup

  // Password must not be empty - full verification via bcryptjs happens in service layer
  password: z.string().min(1, "Password is required"),
});

// ========== UPDATE PROFILE VALIDATION SCHEMA ==========
/**
 * Schema for user profile updates (PUT /api/users/me)
 * Allows updating user's public profile information
 *
 * Fields validated:
 *   - name: Optional, same rules as registration (2-50 chars)
 *   - email: Optional, same rules as registration (valid format)
 *
 * Both fields optional because user may update only name OR only email
 * Backend controller uses whitelisting to only update these 2 fields
 * Other fields like role, password require separate endpoints
 *
 * Zod .optional() means:
 *   - Field not required in request body
 *   - If present, still validates against schema rules
 *   - If absent, field is undefined (filtered by controller)
 */
const userUpdateSchema = z.object({
  // User's updated display name (optional)
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim()
    .optional(), // This field not required in request

  // User's updated email (optional)
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase())
    .optional(), // This field not required in request
});

// ========== CHANGE PASSWORD VALIDATION SCHEMA ==========
/**
 * Schema for password change (POST /api/auth/change-password)
 * Validates password change request from authenticated user
 *
 * Fields validated:
 *   - currentPassword: Non-empty (will be verified against DB hash)
 *   - newPassword: Min 6 chars, must have uppercase + lowercase + number
 *   - confirmNewPassword: String (compared via .refine() below)
 *
 * Requires authentication - only authenticated users can access this endpoint
 * currentPassword must match existing hash - verified in authService.changePassword()
 * newPassword must differ from current password - checked in authService (not here)
 */
const changePasswordSchema = z.object({
  // User's existing password (required to prove account ownership)
  // Hash verification happens in authService via bcryptjs.compare()
  currentPassword: z.string().min(1, "Current password is required"),

  // User's new password - must meet same security requirements as registration
  // Regex: (?=.*[a-z]) = lowercase, (?=.*[A-Z]) = uppercase, (?=.*\d) = digit
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number",
    ),

  // New password confirmation for frontend UX - must match newPassword
  confirmNewPassword: z.string(),
});

/**
 * Password change validation with confirmation check
 * Uses .refine() to verify newPassword === confirmNewPassword
 *
 * Ensures user confirmed their new password correctly before submitting
 * Prevents accidental typos that would lock user out
 */
const changePasswordValidation = changePasswordSchema.refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: "Passwords do not match",
    path: ["confirmNewPassword"], // Error shown on confirmNewPassword field
  },
);

// ========== EXPORT VALIDATION SCHEMAS ==========
// Exports all schemas to be used in validationMiddleware.ts with validate/validateQuery/validateParams
// Usage: app.post('/register', validate(userRegisterValidation), registerController)
module.exports = {
  userRegisterValidation, // Registration with password confirmation
  userLoginSchema, // Login with email + password
  userUpdateSchema, // Profile update with optional name/email
  changePasswordValidation, // Password change with confirmation
};
