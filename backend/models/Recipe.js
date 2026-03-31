const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    image: { type: String }, // URL or path of the image
    ingredients: [{ type: String }],
    steps: [{ type: String }],
    category: { type: String },
    benefits: { type: String },
    state: { type: String },
    recommendedHotels: [
      {
        name: { type: String },
        location: { type: String },
        rating: { type: Number, default: 0 },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Owner of the recipe
    // favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who favorited the recipe
  },
  { timestamps: true },
);

// ========== INDEXES FOR PERFORMANCE ==========
// Index on user for finding recipes by creator
RecipeSchema.index({ user: 1 });
// Index on category for filtering by recipe type
RecipeSchema.index({ category: 1 });
// Index on state for filtering by cuisine region
RecipeSchema.index({ state: 1 });
// Index on createdAt for sorting by newest recipes
RecipeSchema.index({ createdAt: -1 });
// Compound index for common queries: filter by category + sort by newest
RecipeSchema.index({ category: 1, createdAt: -1 });
RecipeSchema.index({ state: 1, createdAt: -1 });
// Text index for searching recipe titles and descriptions
RecipeSchema.index({ title: "text", description: "text", benefits: "text" });

module.exports = mongoose.model("Recipe", RecipeSchema);
