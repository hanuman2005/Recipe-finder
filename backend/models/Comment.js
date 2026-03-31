const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: { type: String, required: true }, // Store username for quick access
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 }, // Optional user rating
  },
  { timestamps: true },
);

// ========== INDEXES FOR PERFORMANCE ==========
// Index on recipeId for finding all comments on a recipe
CommentSchema.index({ recipeId: 1 });
// Index on userId for finding all user's comments
CommentSchema.index({ userId: 1 });
// Compound index for preventing duplicate comments (one per user per recipe)
CommentSchema.index({ recipeId: 1, userId: 1 }, { unique: true });
// Index on createdAt for sorting comments by newest first
CommentSchema.index({ createdAt: -1 });
// Compound index for common query: find comments on recipe, newest first
CommentSchema.index({ recipeId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", CommentSchema);
