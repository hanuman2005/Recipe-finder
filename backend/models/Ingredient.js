/**
 * INGREDIENT MODEL - Centralized Ingredient Database with Images & Regional Names
 *
 * Purpose:
 * - Stores all ingredient metadata in one place for reusability across recipes
 * - Tracks images from Unsplash/Pexels for visual ingredient identification
 * - Maps regional ingredient name variations (paneer=panir=ricotta)
 * - Enables substitution suggestions and ingredient glossary feature
 *
 * Use Case Example:
 * User sees recipe with "paneer" ingredient missing:
 * 1. Look up Ingredient doc for "paneer"
 * 2. Show image from Unsplash so user knows what to look for
 * 3. Show regional names: panper (Tamil), chenna (Bengali), ricotta (Italian equivalent)
 * 4. Show substitutes: tofu, cottage cheese, feta
 * 5. Show where_to_buy: "Indian section, dairy aisle, Whole Foods"
 *
 * Features:
 * - Image URLs from Unsplash API for visual identification
 * - Regional aliases mapping (language: name pairs)
 * - Substitution mapping (which ingredients can replace this)
 * - Category grouping (dairy, spices, proteins, etc)
 * - Shopping guide for ingredient sourcing
 * - Accessibility descriptions for screen readers
 */

const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    // Core ingredient information
    name: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
      unique: true, // No duplicate ingredient entries
      example: "Paneer",
    },

    /**
     * IMAGES - Visual Identification
     * Helps users recognize what the ingredient looks like
     * Multiple image URLs for different contexts (whole, cut, powder form)
     */
    images: {
      // Main image for ingredient identification
      primary: {
        type: String,
        required: [true, "Primary image URL required from Unsplash"],
        example: "https://images.unsplash.com/photo-xxx-paneer",
      },

      // Alternative images showing ingredient in different forms
      alternatives: [
        {
          url: String, // e.g., "https://images.unsplash.com/photo-xxx-shredded"
          label: String, // e.g., "shredded", "blocks", "fresh", "fried"
          description: String, // "Paneer blocks ready for cooking"
        },
      ],

      // Accessibility: Text description for screen readers
      accessibility_description: {
        type: String,
        example:
          "Paneer is a white, cube-shaped fresh cheese. About 2x2 inches, firm but crumbly texture.",
      },
    },

    /**
     * REGIONAL NAMES - Ingredient Identification Across Languages
     * User sees "paneer" but in Tamil it's "panir", in Bengali "chenna"
     * Prevents confusion when following international recipes
     */
    regional_names: {
      type: Map,
      of: [String], // e.g., "ta": ["panir", "pani"], "hi": ["paneer"], "bn": ["chenna"]
      default: new Map(),
      example: {
        ta: ["panir", "pani"], // Tamil
        hi: ["paneer", "chenna paneer"], // Hindi
        bn: ["chenna"], // Bengali
        en: ["paneer", "Indian cheese"], // English
        it: ["ricotta"], // Italian (similar ingredient)
      },
    },

    /**
     * CATEGORY - Ingredient Classification
     * Groups ingredients for filtering, shopping organization
     */
    category: {
      type: String,
      enum: [
        "Protein",
        "Dairy",
        "Spice",
        "Grain",
        "Vegetable",
        "Fruit",
        "Oil",
        "Legume",
        "Herb",
        "Seasoning",
        "Leavening",
        "Sweetener",
        "Acid",
        "Other",
      ],
      required: [true, "Ingredient category required"],
      example: "Dairy",
    },

    /**
     * DESCRIPTION - What is this ingredient?
     * Helps users understand what they're buying/substituting
     */
    description: {
      type: String,
      example:
        "Fresh Indian cottage cheese made from milk curdled with lemon juice. Soft, crumbly texture.",
    },

    /**
     * SUBSTITUTES - What can replace this ingredient?
     * Maps to other Ingredient IDs that can work as substitutes
     * Used by Feature 1: Dynamic Substitution Engine
     */
    substitutes: [
      {
        ingredient_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ingredient",
          example: "ObjectId of Tofu",
        },
        ratio: {
          type: Number,
          default: 1, // 1:1 substitution ratio (1 cup paneer = 1 cup tofu)
          example: 1,
        },
        notes: {
          type: String,
          example:
            "Silken tofu is closest texture match, slight taste difference",
        },
        best_for: {
          type: String,
          enum: [
            "similar_texture",
            "similar_taste",
            "vegan",
            "healthier",
            "budget",
          ],
          example: "similar_texture",
        },
      },
    ],

    /**
     * WHERE TO BUY - Shopping guide
     * Helps users find the ingredient in their local stores
     * Critical for reducing shopping friction
     */
    where_to_buy: {
      type: [String],
      example: [
        "Indian grocery stores (usually refrigerated)",
        "Whole Foods (dairy section)",
        "Regular supermarkets with international section",
        "Online: Amazon Fresh, Instacart, Patel Bros",
      ],
    },

    /**
     * COOKING TIPS - Ingredient-specific usage notes
     * Quick tips for preparation and cooking
     */
    cooking_tips: {
      type: [String],
      example: [
        "Paneer breaks apart if cooked too long - add at the end",
        "Press paneer under weight for 30 min to remove excess moisture",
        "Marinating in yogurt beforehand prevents it from drying out",
      ],
    },

    /**
     * HEALTH/ALLERGY INFO
     * Nutritional info and common allergens
     */
    health_info: {
      calories_per_100g: Number, // e.g., 265
      protein_per_100g: Number, // e.g., 25.2
      fat_per_100g: Number, // e.g., 20.8
      carbs_per_100g: Number, // e.g., 3.6
      common_allergens: [String], // e.g., ["dairy", "lactose"]
      vegan_alternatives: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ingredient",
        },
      ],
      gluten_free: Boolean,
      keto_friendly: Boolean,
    },

    /**
     * STORAGE - How to store this ingredient
     * Reduces waste and spoilage
     */
    storage: {
      room_temperature: String, // e.g., "Not recommended"
      refrigerator: {
        duration: String, // e.g., "5-7 days"
        instructions: String, // e.g., "In airtight container with brine"
      },
      freezer: {
        duration: String, // e.g., "Up to 1 month"
        instructions: String, // e.g., "Wrap tightly in plastic wrap"
      },
    },

    /**
     * POPULARITY TRACKING
     * Metrics for trending ingredients, better recommendations
     */
    usage_count: {
      type: Number,
      default: 0, // Incremented when used in recipes
    },

    // Audit trail
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "Ingredient",
    toJSON: { virtuals: true },
  },
);

/**
 * INDEX STRATEGY - Performance for ingredient lookups
 *
 * Single field indexes (frequent queries):
 * - name: Exact ingredient lookup
 * - category: Filter by category
 *
 * Compound indexes (common queries):
 * - (category, name): Filter by category, then find by name
 * - (regional_names, category): Search regional names within category
 */

// Index for exact name lookups
ingredientSchema.index({ name: 1 });

// Index for category filtering
ingredientSchema.index({ category: 1 });

// Index for recipe-ingredient lookups
ingredientSchema.index({ category: 1, name: 1 });

/**
 * MIDDLEWARE - Pre-save hooks
 */

// Auto-update timestamp on save
ingredientSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * VIRTUAL - Substitute details (populated from substitutes array)
 * Usage: ingredient.populate('substitutes.ingredient_id')
 *
 * Returns full substitute ingredient docs instead of just IDs
 */
ingredientSchema.virtual("substitute_details").get(function () {
  if (!this.populated("substitutes.ingredient_id")) {
    return null;
  }
  return this.substitutes.map((sub) => ({
    name: sub.ingredient_id.name,
    ratio: sub.ratio,
    notes: sub.notes,
    best_for: sub.best_for,
  }));
});

/**
 * STATIC METHODS - Common ingredient queries
 */

/**
 * Find ingredient by exact name or regional name
 * Usage: Ingredient.findByNameOrAlias('panir')
 * Returns: Ingredient doc with name 'Paneer' (Tamil: panir)
 */
ingredientSchema.statics.findByNameOrAlias = async function (searchName) {
  // First try exact name match (case-insensitive)
  let ingredient = await this.findOne({
    name: { $regex: new RegExp(`^${searchName}$`, "i") },
  });

  // If not found, search regional_names Map
  if (!ingredient) {
    ingredient = await this.findOne({
      $or: [
        // Search each regional_names array
        { "regional_names.en": { $regex: searchName, $options: "i" } },
        { "regional_names.hi": { $regex: searchName, $options: "i" } },
        { "regional_names.ta": { $regex: searchName, $options: "i" } },
        { "regional_names.bn": { $regex: searchName, $options: "i" } },
        { "regional_names.te": { $regex: searchName, $options: "i" } },
        { "regional_names.it": { $regex: searchName, $options: "i" } },
      ],
    });
  }

  return ingredient;
};

/**
 * Get all substitutes for an ingredient with full details
 * Usage: Ingredient.getSubstitutesWithDetails('paneer_id')
 * Returns: Array of substitute ingredients with ratio info
 */
ingredientSchema.statics.getSubstitutesWithDetails = async function (
  ingredientId,
) {
  const ingredient = await this.findById(ingredientId).populate(
    "substitutes.ingredient_id",
  );
  return ingredient ? ingredient.substitutes : [];
};

/**
 * Get trending ingredients (most used in recipes)
 * Usage: Ingredient.getTrending(5) -> Top 5 ingredients
 */
ingredientSchema.statics.getTrending = async function (limit = 10) {
  return await this.find().sort({ usage_count: -1 }).limit(limit);
};

module.exports = mongoose.model("Ingredient", ingredientSchema);
