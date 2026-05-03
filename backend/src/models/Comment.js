// ========== CORE DEPENDENCY ==========
const mongoose = require("mongoose"); // MongoDB ODM library

// ========== COMMENT SCHEMA DEFINITION ==========
// Defines structure for user comments/reviews on recipes
// Supports ratings (1-5 stars) and edit tracking
const CommentSchema = new mongoose.Schema(
  {
    // ========== RECIPE REFERENCE ==========
    recipeId: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId
      ref: "Recipe", // Links to Recipe model (establishes relationship)
      required: [true, "Recipe ID is required"], // Every comment must be on a recipe
    },

    // ========== USER REFERENCE ==========
    userId: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId
      ref: "User", // Links to User model (who wrote the comment)
      required: [true, "User ID is required"], // Must track who commented
    },

    // ========== USERNAME CACHE ==========
    // Store username here for quick display without joining User model
    username: {
      type: String, // User's display name
      required: [true, "Username is required"], // Must provide username
    },

    // ========== COMMENT TEXT ==========
    text: {
      type: String, // The actual comment content
      required: [true, "Comment text is required"], // Must provide text
      minlength: [2, "Comment must be at least 2 characters"], // Prevent blank comments
      maxlength: [500, "Comment cannot exceed 500 characters"], // Prevent spam/novels
    },

    // ========== RATING (1-5 STARS) ==========
    rating: {
      type: Number, // Star rating: 1, 2, 3, 4, or 5
      min: [1, "Rating must be at least 1"], // Minimum 1 star
      max: [5, "Rating cannot exceed 5"], // Maximum 5 stars
    },

    // ========== EDIT TRACKING ==========
    isEdited: {
      type: Boolean, // Flag: true if comment was edited after posting
      default: false, // New comments haven't been edited
    },

    editedAt: {
      type: Date, // Timestamp of last edit
      default: null, // null = never edited
    },
  },

  // ========== SCHEMA OPTIONS ==========
  { timestamps: true }, // Auto-add createdAt and updatedAt
);

// ========== DATABASE INDEXES FOR PERFORMANCE ==========
// Indexes make queries faster by pre-sorting data

// Index on recipeId for finding all comments on a specific recipe
CommentSchema.index({ recipeId: 1 });

// Index on userId for finding all comments posted by a specific user
CommentSchema.index({ userId: 1 });

// ========== UNIQUE COMPOUND INDEX ==========
// Ensures one comment per user per recipe (prevents duplicates)
// If user tries to comment twice on same recipe, database rejects it
CommentSchema.index({ recipeId: 1, userId: 1 }, { unique: true });

// Index on createdAt for sorting comments by newest first
CommentSchema.index({ createdAt: -1 }); // -1 = descending/reverse order

// ========== COMPOUND INDEX - COMMON QUERY ==========
// For "Get all comments on recipe X, sorted by newest first"
// Example: showing comments on recipe details page
CommentSchema.index({ recipeId: 1, createdAt: -1 });

// ========== EXPORT COMMENT MODEL ==========
// Export Mongoose model for use in controllers, services, etc
module.exports = mongoose.model("Comment", CommentSchema);
