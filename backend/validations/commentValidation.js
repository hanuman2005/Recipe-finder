// ========== COMMENT VALIDATION SCHEMAS ==========
// Defines all Zod validation schemas for comment-related API endpoints
// Validates: comment creation, updates, and query parameters
// Rules enforce respectful discourse and rating constraints

// Import Zod library for type-safe validation
const { z } = require("zod");

// ========== CREATE COMMENT VALIDATION SCHEMA ==========
/**
 * Schema for creating new comments (POST /api/comments)
 * Validates user comment submission on a recipe
 *
 * Fields validated:
 *   - recipeId: Must be valid MongoDB ID format (24-char hex string)
 *   - text: String 2-500 chars (comment content, trimmed)
 *   - rating: Optional integer 1-5 (star rating)
 *
 * Regex for MongoDB ID: /^[a-f\d]{24}$/i
 *   - ^ = start of string
 *   - [a-f\d] = hex character (a-f or 0-9)
 *   - {24} = exactly 24 characters
 *   - $ = end of string
 *   - i = case-insensitive flag
 *
 * Example:
 *   {
 *     recipeId: "507f1f77bcf86cd799439011",
 *     text: "This recipe is amazing! Very easy to follow.",
 *     rating: 5
 *   }
 */
const createCommentSchema = z.object({
  // MongoDB ID of recipe being commented on (required)
  // Must be exactly 24 hexadecimal characters
  recipeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid recipe ID"),

  // Comment text content (required, 2-500 chars)
  // Must have meaningful length (minimum 2 chars prevents spam)
  text: z
    .string()
    .min(2, "Comment must be at least 2 characters")
    .max(500, "Comment cannot exceed 500 characters")
    .trim(), // Auto-remove leading/trailing whitespace

  // Star rating for recipe (optional, 1-5 stars)
  // User can comment without rating, or rate without detailed comment
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
});

// ========== UPDATE COMMENT VALIDATION SCHEMA ==========
/**
 * Schema for updating existing comments (PUT /api/comments/:id)
 * Allows editing comment text and/or rating
 *
 * All fields optional - user can:
 *   - Update text only and keep rating
 *   - Update rating only and keep text
 *   - Update both text and rating
 *
 * Same field rules as createCommentSchema:
 *   - text: 2-500 chars (same validation)
 *   - rating: 1-5 stars (same validation)
 *
 * Example:
 *   {
 *     text: "Updated comment - I now rate this 4 stars."
 *   }
 */
const updateCommentSchema = z.object({
  // Updated comment text (optional)
  // If present, still must follow 2-500 char rules
  text: z
    .string()
    .min(2, "Comment must be at least 2 characters")
    .max(500, "Comment cannot exceed 500 characters")
    .trim()
    .optional(),

  // Updated rating (optional)
  // If present, still must be 1-5 stars
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
});

// ========== COMMENT QUERY VALIDATION SCHEMA ==========
/**
 * Schema for comment listing/filtering query parameters
 * Validates GET /api/comments/recipe/:recipeId query params
 *
 * Fields validated:
 *   - recipeId: MongoDB ID of recipe (required if not in URL)
 *   - page: Pagination page number (optional, defaults to 1)
 *   - limit: Results per page (optional, max 100, defaults to 10)
 *   - sortBy: Sort order (optional, defaults to "newest")
 *
 * Pagination calculation: skip = (page - 1) * limit
 *   - Page 1: skip 0-10 (items 1-10)
 *   - Page 2: skip 10-20 (items 11-20)
 *   - Page 3: skip 20-30 (items 21-30)
 */
const commentQuerySchema = z.object({
  // MongoDB ID of recipe whose comments to retrieve (required)
  recipeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid recipe ID"),

  // Page number for pagination (optional, defaults to 1)
  // Must be positive integer
  page: z.number().positive().optional().default(1),

  // Results per page (optional, defaults to 10, max 100)
  // Prevents returning too much data in single request
  limit: z.number().positive().max(100).optional().default(10),

  // Sort order for comments (optional, defaults to "newest")
  // Options:
  //   - newest: Most recent comments first (newest createdAt)
  //   - oldest: Oldest comments first (oldest createdAt)
  //   - rating: Highest ratings first (rating descending)
  sortBy: z.enum(["newest", "oldest", "rating"]).optional().default("newest"),
});

// ========== EXPORT VALIDATION SCHEMAS ==========
// Exports all schemas for use in routes via validate/validateQuery middleware
//
// Usage examples:
//   POST /comments: validate(createCommentSchema)
//   PUT /comments/:id: validate(updateCommentSchema)
//   GET /comments/recipe/:id: validateQuery(commentQuerySchema)
module.exports = {
  createCommentSchema, // For POST - create new comment
  updateCommentSchema, // For PUT - update existing comment
  commentQuerySchema, // For GET - filter/sort comments
};
