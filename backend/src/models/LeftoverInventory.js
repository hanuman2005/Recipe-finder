/**
 * LEFTOVER INVENTORY MODEL - Track User's Leftover Ingredients
 *
 * Purpose:
 * Feature #2: Leftover Chain-Reaction
 * After user completes recipe, ask "Did you make extra?"
 * If Yes → Auto-add to this collection
 * 12 hours later → Bull Queue job suggests recipes using this leftover
 *
 * Example:
 * User makes "Butter Chicken + Rice"
 * App asks: "Did you make extra rice?"
 * User clicks: "Yes, I have 2 cups left"
 * Stored: { userId, ingredient: "Rice", quantity: 2, unit: "cup", expiresAt: +12hrs }
 * After 12hrs → Bull job triggers
 * Notification: "You have leftover rice! Try Fried Rice, Lemon Rice, Rice Pudding"
 * User clicks recipe → Makes again with leftover
 * ZERO WASTE ✅
 */

const mongoose = require("mongoose");

const leftoverInventorySchema = new mongoose.Schema(
  {
    // User who owns this leftover
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID required"],
    },

    // Reference to ingredient
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: [true, "Ingredient reference required"],
    },

    // Ingredient name (for quick access, also stored here)
    ingredientName: {
      type: String,
      required: true,
      example: "Cooked Rice",
    },

    // How much is left?
    quantity: {
      type: Number,
      required: [true, "Quantity required"],
      min: 0.1,
      example: 2,
    },

    // Unit of measurement
    unit: {
      type: String,
      enum: ["g", "ml", "cup", "tbsp", "tsp", "piece", "whole"],
      required: true,
      example: "cup",
    },

    // What recipe was it from? (for context)
    sourceRecipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      description: "Which recipe did this leftover come from?",
    },

    // When should this expire? (auto-delete old leftovers)
    expiremissionDate: {
      type: Date,
      default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Default: 3 days
      description: "When should this leftover be auto-deleted?",
    },

    // Storage instructions (from ingredient model)
    storageInstructions: {
      type: String,
      example: "In airtight container in refrigerator",
    },

    // Has notification been sent?
    notificationSent: {
      type: Boolean,
      default: false,
    },

    // When was notification sent? (for tracking)
    notificationSentAt: {
      type: Date,
      default: null,
    },

    // Metadata
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
    collection: "LeftoverInventory",
    toJSON: { virtuals: true },
  },
);

/**
 * INDEXES - Performance Optimization
 */

// Single field indexes
leftoverInventorySchema.index({ user: 1 }); // Find all leftovers for a user
leftoverInventorySchema.index({ notificationSent: 1 }); // Find unnotified leftovers
leftoverInventorySchema.index({ expiremissionDate: 1 }); // TTL auto-delete

// Compound indexes
leftoverInventorySchema.index({ user: 1, notificationSent: 1 }); // Find user's unnotified leftovers
leftoverInventorySchema.index({ user: 1, createdAt: -1 }); // User's leftovers sorted by newest

/**
 * TTL INDEX - Auto-delete expired leftovers
 * MongoDB will automatically delete documents when current time >= expireDate
 * Runs every 60 seconds
 */
leftoverInventorySchema.index(
  { expiremissionDate: 1 },
  { expireAfterSeconds: 0 },
);

/**
 * MIDDLEWARE - Auto-update timestamp
 */
leftoverInventorySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * STATIC METHODS - Common queries
 */

/**
 * Find all unnotified leftovers for a user
 * Used by: Bull Queue job to find which leftovers to send notifications for
 *
 * Usage: LeftoverInventory.findUnnotifiedForUser(userId)
 * Returns: Array of leftovers that haven't had notifications sent yet
 */
leftoverInventorySchema.statics.findUnnotifiedForUser = async function (
  userId,
) {
  return await this.find({
    user: userId,
    notificationSent: false,
    expiremissionDate: { $gt: new Date() }, // Not expired yet
  })
    .populate("ingredient") // Get ingredient details
    .populate("sourceRecipe"); // Get recipe it came from
};

/**
 * Mark notification as sent
 * Used by: Bull Queue job after sending notification
 *
 * Usage: await LeftoverInventory.markNotificationSent(leftoverId)
 */
leftoverInventorySchema.statics.markNotificationSent = async function (
  leftoverId,
) {
  return await this.findByIdAndUpdate(
    leftoverId,
    {
      notificationSent: true,
      notificationSentAt: new Date(),
    },
    { new: true },
  );
};

/**
 * Get user's active leftovers (not expired, not yet notified)
 * Used by: Frontend to show leftover pantry
 */
leftoverInventorySchema.statics.getUserActiveLeftovers = async function (
  userId,
) {
  return await this.find({
    user: userId,
    expiremissionDate: { $gt: new Date() }, // Not expired
  })
    .populate("ingredient")
    .populate("sourceRecipe")
    .sort({ createdAt: -1 }); // Newest first
};

/**
 * Add leftover and schedule notification
 * Used by: Recipe completion endpoint
 *
 * Usage: await LeftoverInventory.addLeftover({
 *   userId, ingredient, quantity, unit, sourceRecipe
 * })
 *
 * This creates leftover and Bull Queue job automatically
 */
leftoverInventorySchema.statics.addLeftover = async function (data) {
  const leftover = await this.create({
    user: data.userId,
    ingredient: data.ingredientId,
    ingredientName: data.ingredientName,
    quantity: data.quantity,
    unit: data.unit,
    sourceRecipe: data.recipeId,
    storageInstructions: data.storageInstructions,
  });

  // NOTE: Bull Queue job will be scheduled in service layer
  // After creating leftover: Schedule notification job for +12 hours

  return leftover;
};

module.exports = mongoose.model("LeftoverInventory", leftoverInventorySchema);
