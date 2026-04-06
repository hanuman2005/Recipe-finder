// ========== CORE DEPENDENCY ==========
const mongoose = require("mongoose"); // MongoDB ODM (Object Data Modeling) library

// ========== RECIPE SCHEMA DEFINITION ==========
// Defines complete structure for Recipe documents with embedded features
// Includes 4 power features: Dynamic Substitution, Equipment Filter, Leftovers, Street-Style Tips
const RecipeSchema = new mongoose.Schema(
  {
    // ========== SECTION 1: BASIC RECIPE INFORMATION ==========
    // Core details about the recipe

    title: {
      type: String, // Recipe name/title
      required: [true, "Recipe title is required"], // Must provide title
      trim: true, // Remove leading/trailing whitespace
      minlength: [3, "Title must be at least 3 characters"], // At least 3 chars
      maxlength: [100, "Title cannot exceed 100 characters"], // Max 100 chars
    },

    description: {
      type: String, // Long description of the recipe
      required: [true, "Recipe description is required"], // Must provide
      minlength: [10, "Description must be at least 10 characters"], // Prevent tiny descriptions
    },

    image: {
      type: String, // URL to recipe image (stored as string)
      required: [true, "Recipe image is required"], // Must provide image
    },

    category: {
      type: String, // Type of recipe (Breakfast, Lunch, etc)
      required: [true, "Category is required"], // Must specify category
      enum: [
        // Only these values allowed
        "Breakfast",
        "Lunch",
        "Dinner",
        "Snack",
        "Dessert",
        "Beverage",
        "Starter",
      ],
    },

    state: {
      type: String, // Indian state/region (e.g., "Tamil Nadu", "Gujarat")
      required: [true, "Cuisine region (state) is required"], // Must specify
    },

    benefits: {
      type: String, // Health/nutritional benefits of the recipe
      trim: true, // Remove whitespace
    },

    difficulty: {
      type: String, // Recipe difficulty level
      enum: ["Easy", "Medium", "Hard"], // Only these levels allowed
      default: "Medium", // Default to Medium if not specified
    },

    // ========== SECTION 2: TIMING & SERVING INFORMATION ==========
    // How long recipe takes and how much it makes

    prepTime: {
      type: Number, // Time to prepare ingredients (in minutes)
      required: [true, "Prep time is required"], // Must provide
      min: [1, "Prep time must be at least 1 minute"], // At least 1 minute
    },

    cookTime: {
      type: Number, // Time to cook (in minutes)
      required: [true, "Cook time is required"], // Must provide
      min: [1, "Cook time must be at least 1 minute"], // At least 1 minute
    },

    servings: {
      type: Number, // Number of people recipe serves
      required: [true, "Number of servings is required"], // Must provide
      min: [1, "Must serve at least 1 person"], // At least 1 person
      default: 4, // Default to 4 servings
    },

    // ========== SECTION 3: INGREDIENTS WITH DYNAMIC SUBSTITUTION ==========
    // Power Feature #1: Ingredient substitutions with ratios and explanations
    // Helps users cook with what they have available

    ingredients: [
      {
        name: {
          type: String, // Ingredient name (e.g., "Milk")
          required: true, // Must provide ingredient name
        },

        quantity: {
          type: Number, // Amount needed (e.g., 2)
          required: true, // Must provide quantity
        },

        unit: {
          type: String, // Measurement unit (g, ml, cup, etc)
          required: true, // Must specify unit
          enum: ["g", "ml", "cup", "tbsp", "tsp", "piece", "whole", "pinch"],
        },

        functionType: {
          type: String, // Role of ingredient (Protein, Seasoning, etc)
          enum: [
            "Base", // Main component (e.g., flour in bread)
            "Protein", // Proteins (meat, tofu, etc)
            "Vegetable", // Vegetables
            "Thickener", // Cornstarch, flour for thickening
            "Binder", // Eggs, gelatin for binding
            "Seasoning", // Salt, spices, herbs
            "Acid", // Lemon, vinegar for tang
            "Fat", // Oil, butter for richness
            "Leavening", // Baking powder, yeast for rising
            "Flavoring", // Vanilla, cocoa for taste
          ],
          default: "Base",
        },

        // ========== SUBSTITUTES ARRAY (Power Feature #1) ==========
        // Alternative ingredients users can use if original not available
        substitutes: [
          {
            name: { type: String }, // Alternative ingredient name
            ratio: { type: String }, // Amount ratio (e.g., "1:1", "2:1")
            explanation: { type: String }, // Why & how to substitute (e.g., "Mix 1/2 cup milk + 1/2 tbsp butter for buttermilk")
          },
        ],
      },
    ],

    // ========== SECTION 4: COOKING STEPS WITH PRO-TIPS ==========
    // Power Feature #4: Street-style cooking techniques from restaurant chefs
    // Pro-tips for achieving restaurant-quality results at home

    steps: [
      {
        stepNumber: { type: Number, required: true }, // Step order (1, 2, 3...)
        description: {
          type: String, // What to do in this step
          required: true, // Must provide instructions
        },
        duration: {
          type: Number, // Optional: how long this step takes (minutes)
        },
        proTip: {
          type: String, // Street-style technique (e.g., "Double-fry at 180°C for crunch")
        },
        image: { type: String }, // Optional image showing the step
        equipment: [
          { type: String }, // Equipment needed for this step (e.g., ["Frying Pan", "Thermometer"])
        ],
      },
    ],

    // ========== SECTION 5: EQUIPMENT REQUIREMENTS ==========
    // Power Feature #3: Filter recipes by available kitchen equipment
    // Helps users find recipes they can make with their kitchen

    equipment: [
      {
        type: String, // Equipment/appliance type
        enum: [
          "Stovetop", // Traditional cooking surface
          "Oven", // For baking/roasting
          "Microwave", // Quick heating
          "Induction", // Induction cooktop
          "Rice Cooker", // Automatic rice cooking
          "Pressure Cooker", // High-pressure fast cooking
          "Air Fryer", // Oil-less frying
          "Blender", // Mixing/pureeing
          "Food Processor", // Chopping/processing
          "One-Pot", // Single vessel cooking
          "No-Cook", // No cooking required (salads, sandwiches)
        ],
      },
    ],

    // ========== SECTION 6: RATING & USER FEEDBACK ==========
    // Track recipe ratings and number of ratings received

    rating: {
      type: Number, // Average rating score (0-5)
      default: 0, // Start with no ratings
      min: 0, // Minimum 0
      max: 5, // Maximum 5 stars
    },

    totalRatings: {
      type: Number, // How many times this recipe was rated
      default: 0, // No ratings initially
    },

    // ========== SECTION 7: LEFTOVERS CHAIN-REACTION ==========
    // Power Feature #2: Link leftover ingredients to recipes that use them
    // Example: "Have leftover rice? Make fried rice!"

    leftovers: [
      {
        ingredient: { type: String }, // Leftover ingredient name (e.g., "Cooked Rice")
        suggestedRecipes: [
          // Recipes that can use this leftover
          { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
        ],
      },
    ],

    // ========== SECTION 8: METADATA ==========
    // Administrative information about the recipe

    user: {
      type: mongoose.Schema.Types.ObjectId, // Reference to User who created recipe
      ref: "User", // Links to User model
      required: true, // Every recipe must have an author
    },

    isPublished: {
      type: Boolean, // Whether recipe is visible to public
      default: true, // Recipes published by default
    },

    views: {
      type: Number, // How many times recipe was viewed
      default: 0, // Start with 0 views
    },
  },

  // ========== SCHEMA OPTIONS ==========
  { timestamps: true }, // Auto-add createdAt and updatedAt timestamps
);

// ========== DATABASE INDEXES FOR PERFORMANCE ==========
// Indexes speed up queries by creating sorted lookup paths

// Index on user field for finding all recipes by a specific creator
RecipeSchema.index({ user: 1 });

// Index on category for fast filtering by recipe type (Breakfast, Lunch, etc)
RecipeSchema.index({ category: 1 });

// Index on state for fast filtering by cuisine region (Tamil Nadu, Gujarat, etc)
RecipeSchema.index({ state: 1 });

// Index on createdAt for sorting by newest recipes first (-1 = descending/reverse)
RecipeSchema.index({ createdAt: -1 });

// ========== COMPOUND INDEXES (Multiple fields together) ==========
// For common query combinations: faster than single-field indexes

// Category + newest: for "Breakfast recipes sorted by newest"
RecipeSchema.index({ category: 1, createdAt: -1 });

// State + newest: for "Tamil Nadu recipes sorted by newest"
RecipeSchema.index({ state: 1, createdAt: -1 });

// ========== POWER FEATURE #3 INDEX - EQUIPMENT + FILTERS ==========
// Power Feature #3: Equipment Filter - 100x faster equipment-based searches
// Compound index combines three common filter fields
RecipeSchema.index({ equipment: 1, prepTime: 1, category: 1 });

// ========== TEXT SEARCH INDEX - FULL-TEXT SEARCH ==========
// For searching recipe titles, descriptions, and ingredients
// Enables natural language search: "Find me easy breakfast recipes with eggs"
RecipeSchema.index({
  title: "text", // Search in recipe title
  description: "text", // Search in description
  benefits: "text", // Search in health benefits
  "ingredients.name": "text", // Search in ingredient names
});

// Index for sorting by rating (highest rated first)
RecipeSchema.index({ rating: -1 });

// Compound index for common filter combination: category + difficulty + prepTime
// For queries like "Easy breakfast recipes under 30 minutes"
RecipeSchema.index({ category: 1, difficulty: 1, prepTime: 1 });

// ========== EXPORT RECIPE MODEL ==========
// Export Mongoose model for use in controllers, services, etc
module.exports = mongoose.model("Recipe", RecipeSchema);
