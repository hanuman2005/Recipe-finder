/**
 * LEFTOVER SERVICE - Business Logic for Zero-Waste System
 *
 * Purpose:
 * - Manage leftover inventory (add, remove, list)
 * - Find recipes that use specific leftovers
 * - Generate smart notifications
 * - Schedule 12-hour reminder jobs (Bull Queue)
 *
 * Example Flow:
 * 1. User completes recipe: "Butter Chicken & Rice"
 * 2. App calls: leftoverService.addLeftover(userId, "Rice", 2, "cup")
 * 3. Service creates LeftoverInventory doc
 * 4. Service schedules Bull job: "12 hours later, notify this user"
 * 5. After 12 hours, Bull job runs
 * 6. Job calls: leftoverService.generateRecipeSuggestions("Rice")
 * 7. Service finds recipes using Rice: ["Fried Rice", "Lemon Rice", "Rice Pudding"]
 * 8. Sends notification: "You have rice! Try these..."
 */

const LeftoverInventory = require("../models/LeftoverInventory");
const Recipe = require("../models/Recipe");
const Ingredient = require("../models/Ingredient");
const AppError = require("../utils/AppError");

/**
 * ADD LEFTOVER TO PANTRY
 *
 * Called when user completes a recipe and says "I made extra"
 *
 * Usage:
 * await leftoverService.addLeftover({
 *   userId: "user123",
 *   ingredientId: "paneer_id",
 *   ingredientName: "Paneer",
 *   quantity: 2,
 *   unit: "cup",
 *   recipeId: "butter_chicken_id",
 *   storageInstructions: "In airtight container, refrigerate"
 * })
 *
 * Returns: Leftover document + scheduled Bull job
 */
const addLeftover = async (leftoverData) => {
  try {
    // Validate ingredient exists
    const ingredient = await Ingredient.findById(leftoverData.ingredientId);
    if (!ingredient) {
      throw new AppError("Ingredient not found", 404);
    }

    // Create leftover document
    const leftover = await LeftoverInventory.addLeftover({
      userId: leftoverData.userId,
      ingredientId: leftoverData.ingredientId,
      ingredientName: leftoverData.ingredientName || ingredient.name,
      quantity: leftoverData.quantity,
      unit: leftoverData.unit,
      recipeId: leftoverData.recipeId,
      storageInstructions:
        leftoverData.storageInstructions ||
        ingredient.storage?.refrigerator?.instructions,
    });

    // Schedule Bull Queue job (will run in 12 hours)
    // TODO: Import leftoverProcessor and schedule job
    // const leftoverQueue = require('../jobs/queueConfig').leftoverQueue;
    // await leftoverQueue.add(
    //   { leftoverId: leftover._id, userId: leftoverData.userId },
    //   { delay: 12 * 60 * 60 * 1000 } // 12 hours
    // );

    return leftover;
  } catch (error) {
    throw new AppError(
      error.message || "Error adding leftover",
      error.statusCode || 500,
    );
  }
};

/**
 * GET USER'S LEFTOVER PANTRY
 *
 * Returns all active leftovers for user (not expired)
 *
 * Usage:
 * const pantry = await leftoverService.getUserPantry(userId);
 * // Returns: [
 * //   { ingredientName: "Rice", quantity: 2, unit: "cup", image: "url" },
 * //   { ingredientName: "Paneer", quantity: 0.5, unit: "cup", image: "url" }
 * // ]
 *
 * Frontend displays this as virtual pantry inventory
 */
const getUserPantry = async (userId) => {
  const leftovers = await LeftoverInventory.getUserActiveLeftovers(userId);

  // Format for frontend
  return leftovers.map((leftover) => ({
    _id: leftover._id,
    ingredientName: leftover.ingredientName,
    ingredientId: leftover.ingredient?._id,
    image: leftover.ingredient?.images?.primary,
    quantity: leftover.quantity,
    unit: leftover.unit,
    storageInstructions: leftover.storageInstructions,
    sourceRecipe: leftover.sourceRecipe?.title,
    createdAt: leftover.createdAt,
    expiresAt: leftover.expiremissionDate,
    daysUntilExpire: Math.ceil(
      (leftover.expiremissionDate - Date.now()) / (24 * 60 * 60 * 1000),
    ),
  }));
};

/**
 * REMOVE LEFTOVER FROM PANTRY
 *
 * User either used the leftover or it expired
 *
 * Usage:
 * await leftoverService.removeLeftover(leftoverId)
 */
const removeLeftover = async (leftoverId) => {
  const deleted = await LeftoverInventory.findByIdAndDelete(leftoverId);

  if (!deleted) {
    throw new AppError("Leftover not found", 404);
  }

  return deleted;
};

/**
 * GENERATE RECIPE SUGGESTIONS FOR LEFTOVER
 *
 * Core of Feature #2: When Bull job runs, find recipes using this ingredient
 *
 * Usage:
 * const suggestions = await leftoverService.generateRecipeSuggestions(
 *   ingredientName,
 *   userId
 * );
 * // Returns: [
 * //   { title: "Fried Rice", _id: "...", rating: 4.5, match: 0.95 },
 * //   { title: "Lemon Rice", _id: "...", rating: 4.3, match: 0.92 }
 * // ]
 *
 * Algorithm:
 * 1. Find ingredient from name
 * 2. Search recipes that include this ingredient
 * 3. Prioritize recipes user hasn't made recently
 * 4. Return top 5 with images
 */
const generateRecipeSuggestions = async (ingredientName, userId, limit = 5) => {
  try {
    // Find ingredient by name
    const ingredient = await Ingredient.findByNameOrAlias(ingredientName);

    if (!ingredient) {
      return []; // No recipes for unknown ingredient
    }

    // Find recipes that use this ingredient
    // Match by ingredient name (could be in different forms)
    const recipes = await Recipe.find({
      "ingredients.ingredient": ingredient._id,
      isPublished: true,
    })
      .sort({ rating: -1, createdAt: -1 }) // Highest rated, newest first
      .limit(limit)
      .populate("ingredients.ingredient");

    // Format for notification
    return recipes.map((recipe) => ({
      title: recipe.title,
      _id: recipe._id,
      image: recipe.image,
      rating: recipe.rating,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      category: recipe.category,
      matchReason: `Uses ${ingredient.name}`,
    }));
  } catch (error) {
    throw new AppError(
      error.message || "Error generating suggestions",
      error.statusCode || 500,
    );
  }
};

/**
 * FIND UNNOTIFIED LEFTOVERS
 *
 * Called by Bull Queue job processor
 * Returns leftovers that have been in pantry 12+ hours and haven't been notified
 *
 * Usage:
 * const leftoversToNotify = await leftoverService.findUnnotifiedLeftovers(userId);
 * // Returns: Array of LeftoverInventory docs
 */
const findUnnotifiedLeftovers = async (userId) => {
  return await LeftoverInventory.findUnnotifiedForUser(userId);
};

/**
 * MARK NOTIFICATION SENT
 *
 * After sending notification, mark leftover as notified
 * Prevents duplicate notifications
 *
 * Usage:
 * await leftoverService.markNotificationSent(leftoverId);
 */
const markNotificationSent = async (leftoverId) => {
  return await LeftoverInventory.markNotificationSent(leftoverId);
};

/**
 * GET LEFTOVER DETAILS
 *
 * When user clicks on leftover in pantry, show full details
 *
 * Usage:
 * const details = await leftoverService.getLeftoverDetails(leftoverId);
 * // Returns full leftover doc with ingredient + recipe + suggestions
 */
const getLeftoverDetails = async (leftoverId) => {
  const leftover = await LeftoverInventory.findById(leftoverId)
    .populate("ingredient")
    .populate("sourceRecipe");

  if (!leftover) {
    throw new AppError("Leftover not found", 404);
  }

  // Generate suggested recipes for this leftover
  const suggestions = await generateRecipeSuggestions(leftover.ingredientName);

  return {
    ...leftover.toObject(),
    suggestedRecipes: suggestions,
  };
};

/**
 * CLEANUP EXPIRED LEFTOVERS
 *
 * MongoDB TTL index handles auto-delete, but this method can be called manually
 * Useful for cleanup jobs or admin operations
 *
 * Usage:
 * await leftoverService.cleanupExpiredLeftovers();
 */
const cleanupExpiredLeftovers = async () => {
  const result = await LeftoverInventory.deleteMany({
    expiremissionDate: { $lt: new Date() },
  });

  return {
    message: `Deleted ${result.deletedCount} expired leftovers`,
    count: result.deletedCount,
  };
};

/**
 * GET STATISTICS
 *
 * Analytics: How much food waste are we preventing?
 *
 * Usage:
 * const stats = await leftoverService.getStatistics(userId);
 * // Returns: {
 * //   totalLeftovers: 5,
 * //   uniqueIngredients: 3,
 * //   recipesRecommended: 12,
 * //   foodWasteAreasApproximately: "2 lbs",
 * //   notifications: 3
 * // }
 */
const getStatistics = async (userId) => {
  const leftovers = await LeftoverInventory.find({
    user: userId,
    expiremissionDate: { $gt: new Date() },
  });

  // Calculate total weight/volume
  let totalQuantity = 0;
  const ingredientTypes = new Set();

  leftovers.forEach((leftover) => {
    totalQuantity += leftover.quantity;
    ingredientTypes.add(leftover.ingredientName);
  });

  return {
    totalLeftovers: leftovers.length,
    uniqueIngredients: ingredientTypes.size,
    totalQuantity: totalQuantity,
    wastePreventionMessage: `You've saved approximately ${totalQuantity.toFixed(1)} units of food from waste!`,
  };
};

// ========== EXPORT SERVICE METHODS ==========
module.exports = {
  addLeftover,
  getUserPantry,
  removeLeftover,
  generateRecipeSuggestions,
  findUnnotifiedLeftovers,
  markNotificationSent,
  getLeftoverDetails,
  cleanupExpiredLeftovers,
  getStatistics,
};
