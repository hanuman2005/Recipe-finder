/**
 * INGREDIENT EXPLANATION CONTROLLER
 *
 * Endpoints for fetching ingredient explanations
 * Used by recipe detail page to show WHY each ingredient is needed
 */

const ingredientExplanationService = require("../services/ingredientExplanationService");
const responseHandler = require("../utils/responseHandler");
const AppError = require("../utils/AppError");

/**
 * GET INGREDIENTS FOR RECIPE WITH EXPLANATIONS
 *
 * Route: GET /api/recipes/:recipeId/ingredients-explained
 *
 * Returns all ingredients in a recipe with:
 * - Function type (Base, Protein, Fat, Binder, etc.)
 * - Why it's used in THIS recipe
 * - Substitution options
 * - Difficulty level
 * - Tips on usage
 */
exports.getRecipeIngredientsExplained = async (req, res, next) => {
  try {
    const { recipeId } = req.params;

    // Validate recipe ID
    if (!recipeId || recipeId.length !== 24) {
      return next(new AppError("Invalid recipe ID", 400));
    }

    // Get ingredients with explanations
    const ingredientsWithExplanations =
      await ingredientExplanationService.getRecipeIngredientsWithExplanations(
        recipeId,
      );

    // Success response
    responseHandler.success(res, {
      message: `Retrieved ${ingredientsWithExplanations.length} ingredients with explanations`,
      data: ingredientsWithExplanations,
      count: ingredientsWithExplanations.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE INGREDIENT EXPLANATION
 *
 * Route: GET /api/recipes/:recipeId/ingredients/:ingredientId/explain
 *
 * Returns detailed explanation of one specific ingredient in a recipe
 * Includes:
 * - Why it's needed
 * - What it does
 * - Substitution options
 * - Cooking tips
 * - Difficulty level
 */
exports.getIngredientExplained = async (req, res, next) => {
  try {
    const { recipeId, ingredientId } = req.params;

    // Validation
    if (
      !recipeId ||
      recipeId.length !== 24 ||
      !ingredientId ||
      ingredientId.length !== 24
    ) {
      return next(new AppError("Invalid recipe or ingredient ID", 400));
    }

    // Get explanation
    const explanation =
      await ingredientExplanationService.getIngredientExplanation(
        recipeId,
        ingredientId,
      );

    // Add extra educational info
    const importance = ingredientExplanationService.getIngredientImportance(
      explanation.functionType,
    );
    const difficulty = ingredientExplanationService.getIngredientDifficulty(
      explanation.functionType,
    );

    const enhanced = {
      ...explanation,
      importance,
      difficulty,
      tip: `🎯 Level: ${difficulty} | ${importance}`,
    };

    responseHandler.success(res, {
      message: "Ingredient explanation retrieved",
      data: enhanced,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET INGREDIENT COMPARISON
 *
 * Route: GET /api/ingredients/:ingredientId/why-used
 *
 * Explains:
 * - Why this ingredient category exists
 * - What it does in general cooking
 * - Common recipes that use it
 * - Substitution rules
 * - Health benefits
 */
exports.getIngredientWhy = async (req, res, next) => {
  try {
    const { ingredientId } = req.params;

    if (!ingredientId || ingredientId.length !== 24) {
      return next(new AppError("Invalid ingredient ID", 400));
    }

    const Ingredient = require("../models/Ingredient");
    const ingredient = await Ingredient.findById(ingredientId);

    if (!ingredient) {
      return next(new AppError("Ingredient not found", 404));
    }

    const functionType = ingredient.functionType || "Unknown";
    const explanation =
      ingredientExplanationService.getColorfulExplanation(functionType);
    const importance =
      ingredientExplanationService.getIngredientImportance(functionType);

    responseHandler.success(res, {
      message: "Ingredient information retrieved",
      data: {
        _id: ingredient._id,
        name: ingredient.name,
        image: ingredient.image,
        functionType,
        whyIt: explanation,
        importance,
        regionalNames: ingredient.regionalNames,
        substitutes: ingredient.substitutes ? ingredient.substitutes.length : 0,
        nutritionPer100g: ingredient.nutritionPer100g,
        uses: ingredient.uses,
        allergens: ingredient.allergens,
        tips: [
          ...ingredientExplanationService
            .getIngredientImportance(functionType)
            .split(". "),
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET DIFFICULTY LEVEL FOR RECIPE
 *
 * Route: GET /api/recipes/:recipeId/difficulty-by-ingredients
 *
 * Analyzes recipe ingredients to determine overall difficulty
 * Returns:
 * - Easy ingredients (Base, Liquid, Flavoring)
 * - Medium ingredients (Protein, Acid, Sweetener)
 * - Hard ingredients (Binder, Thickener)
 * - Overall difficulty score
 */
exports.getRecipeDifficultyByIngredients = async (req, res, next) => {
  try {
    const { recipeId } = req.params;

    if (!recipeId || recipeId.length !== 24) {
      return next(new AppError("Invalid recipe ID", 400));
    }

    const ingredientsWithExplanations =
      await ingredientExplanationService.getRecipeIngredientsWithExplanations(
        recipeId,
      );

    // Categorize by difficulty
    const easyIngredients = [];
    const mediumIngredients = [];
    const hardIngredients = [];

    ingredientsWithExplanations.forEach((ing) => {
      const difficulty = ingredientExplanationService.getIngredientDifficulty(
        ing.functionType,
      );

      if (difficulty === "Easy") {
        easyIngredients.push(ing.name);
      } else if (difficulty === "Medium") {
        mediumIngredients.push(ing.name);
      } else {
        hardIngredients.push(ing.name);
      }
    });

    // Calculate overall difficulty
    let overallDifficulty = "Easy";
    if (hardIngredients.length > 0) {
      overallDifficulty = "Hard";
    } else if (mediumIngredients.length >= 3) {
      overallDifficulty = "Medium";
    }

    responseHandler.success(res, {
      message: "Recipe difficulty analysis completed",
      data: {
        overallDifficulty,
        easyIngredients,
        mediumIngredients,
        hardIngredients,
        skillsNeeded: [
          ...new Set([
            ...mediumIngredients.map((ing) => `Properly ${ing.toLowerCase()}`),
            ...hardIngredients.map((ing) => `Mastering ${ing.toLowerCase()}`),
          ]),
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
