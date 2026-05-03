/**
 * INGREDIENT EXPLANATION ROUTES
 *
 * Educational endpoints explaining WHY each ingredient is used
 * This solves the user pain point: "I want to understand what each ingredient does"
 */

const express = require("express");
const ingredientExplanationController = require("../controllers/ingredientExplanationController");

const router = express.Router();

/**
 * GET /api/recipes/:recipeId/ingredients-explained
 *
 * Returns all ingredients for a recipe with detailed explanations
 * Shows what each ingredient does and why it's needed
 *
 * Response:
 * {
 *   success: true,
 *   message: "Retrieved 8 ingredients with explanations",
 *   data: [
 *     {
 *       name: "Cream",
 *       quantity: 200,
 *       unit: "ml",
 *       functionType: "Fat",
 *       explanation: "Emulsifies with pasta water to create smooth, clingy sauce...",
 *       whyNeeded: "🧈 Adds richness & flavor",
 *       replacements: 3
 *     },
 *     ...
 *   ]
 * }
 */
router.get(
  "/recipes/:recipeId/ingredients-explained",
  ingredientExplanationController.getRecipeIngredientsExplained,
);

/**
 * GET /api/recipes/:recipeId/ingredients/:ingredientId/explain
 *
 * Get detailed explanation of a single ingredient in a recipe
 * Includes cooking tips, difficulty level, importance notes
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     name: "Cream",
 *     functionType: "Fat",
 *     explanation: "...",
 *     importance: "Too little: ricottaless. Too much: too much.",
 *     difficulty: "Easy",
 *     tip: "🎯 Level: Easy | Too little: lacks richness. Too much: becomes heavy."
 *   }
 * }
 */
router.get(
  "/recipes/:recipeId/ingredients/:ingredientId/explain",
  ingredientExplanationController.getIngredientExplained,
);

/**
 * GET /api/ingredients/:ingredientId/why-used
 *
 * General education about why this ingredient exists
 * Not specific to a recipe - general knowledge
 *
 * Explains:
 * - What ingredient function type is (Base, Protein, Fat, etc.)
 * - Why this type is important in cooking
 * - What it does
 * - Substitution rules
 * - Health benefits
 */
router.get(
  "/ingredients/:ingredientId/why-used",
  ingredientExplanationController.getIngredientWhy,
);

/**
 * GET /api/recipes/:recipeId/difficulty-by-ingredients
 *
 * Analyzes ingredients to determine recipe difficulty for learners
 * Shows which ingredients are "tricky" and require skill
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     overallDifficulty: "Medium",
 *     easyIngredients: ["Water", "Salt", "Oil"],
 *     mediumIngredients: ["Eggs", "Cream"],
 *     hardIngredients: ["Cornstarch"],
 *     skillsNeeded: ["Properly tempering eggs", "Mastering texture"]
 *   }
 * }
 */
router.get(
  "/recipes/:recipeId/difficulty-by-ingredients",
  ingredientExplanationController.getRecipeDifficultyByIngredients,
);

module.exports = router;
