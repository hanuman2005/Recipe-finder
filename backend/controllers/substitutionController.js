/**
 * SUBSTITUTION CONTROLLER - HTTP Request Handlers (Feature #1)
 *
 * Purpose:
 * Expose substitutionService methods via REST API
 * Handles requests like:
 * - GET /api/substitutions?ingredient=cream&recipe=pasta
 * - POST /api/substitutions/validate
 * - GET /api/substitutions/:id/explanation
 *
 * All responses include:
 * - Status code
 * - Message
 * - Data (suggestions, explanations, etc.)
 */

const substitutionService = require("../services/substitutionService");
const AppError = require("../utils/AppError");
const responseHandler = require("../utils/responseHandler");

/**
 * GET SUBSTITUTES - Main feature endpoint
 *
 * Query Params:
 * - ingredient (required): Ingredient to find substitutes for
 * - recipe (optional): Recipe context for better suggestions
 *
 * Example:
 * GET /api/substitutions?ingredient=cream&recipe=carbonara
 *
 * Returns:
 * {
 *   success: true,
 *   message: "Found 4 substitutes for cream",
 *   data: [
 *     { name: "Milk + Butter", ratio: "2:1", explanation: "...", category: "similar_texture" },
 *     { name: "Greek Yogurt", ratio: "1:1", explanation: "...", category: "similar_taste" }
 *   ]
 * }
 */
exports.getSubstitutes = async (req, res, next) => {
  try {
    const { ingredient, recipe } = req.query;

    // Validate input
    if (!ingredient) {
      return next(
        new AppError("Ingredient name is required in query params", 400),
      );
    }

    // Get substitutes
    const substitutes = await substitutionService.getSubstitutes(
      ingredient,
      recipe || "",
    );

    // Response
    return responseHandler.success(res, {
      substitutes,
      ingredient,
      recipe: recipe || "general",
      count: substitutes.length,
    });
  } catch (error) {
    console.error(`❌ Controller Error - getSubstitutes:`, error.message);
    return next(error);
  }
};

/**
 * GET SUBSTITUTION EXPLANATION
 *
 * When user selects a substitute, get detailed cooking instructions
 *
 * Query Params:
 * - original (required): Original ingredient
 * - substitute (required): Chosen substitute
 * - recipe (optional): Recipe context
 *
 * Example:
 * GET /api/substitutions/explain?original=cream&substitute=greek_yogurt&recipe=pasta
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     originalIngredient: "cream",
 *     substitute: "greek yogurt",
 *     instructions: "Add the yogurt slowly while stirring..."
 *   }
 * }
 */
exports.getExplanation = async (req, res, next) => {
  try {
    const { original, substitute, recipe } = req.query;

    // Validate input
    if (!original || !substitute) {
      return next(
        new AppError(
          'Both "original" and "substitute" query params required',
          400,
        ),
      );
    }

    // Get detailed explanation
    const explanation = await substitutionService.getSubstitutionExplanation(
      original,
      substitute,
      recipe || "",
    );

    return responseHandler.success(res, explanation);
  } catch (error) {
    console.error(`❌ Controller Error - getExplanation:`, error.message);
    return next(error);
  }
};

/**
 * SUGGEST FOR MULTIPLE MISSING INGREDIENTS
 *
 * When parsing a recipe, find all missing ingredients
 * and get substitutes for each
 *
 * Request Body:
 * {
 *   missingIngredients: ["cream", "paneer", "ghee"],
 *   recipeName: "Butter Chicken"
 * }
 *
 * Example:
 * POST /api/substitutions/batch
 * {
 *   "missingIngredients": ["cream", "paneer"],
 *   "recipeName": "Indian Butter Chicken"
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     cream: [...],
 *     paneer: [...]
 *   }
 * }
 */
exports.suggestForMissing = async (req, res, next) => {
  try {
    const { missingIngredients, recipeName } = req.body;

    // Validate input
    if (!missingIngredients || !Array.isArray(missingIngredients)) {
      return next(
        new AppError(
          "missingIngredients must be an array of ingredient names",
          400,
        ),
      );
    }

    if (missingIngredients.length === 0) {
      return next(
        new AppError("missingIngredients array cannot be empty", 400),
      );
    }

    // Get suggestions
    const suggestions = await substitutionService.suggestForMissingIngredients(
      missingIngredients,
      recipeName || "",
    );

    return responseHandler.success(res, {
      suggestions,
      totalMissing: missingIngredients.length,
      recipeName: recipeName || "Unknown",
    });
  } catch (error) {
    console.error(`❌ Controller Error - suggestForMissing:`, error.message);
    return next(error);
  }
};

/**
 * VALIDATE SUBSTITUTION FEASIBILITY
 *
 * Check if a substitution would actually work for a recipe
 * Prevents user from trying infeasible substitutions
 *
 * Request Body:
 * {
 *   original: "wheat flour",
 *   substitute: "almond flour",
 *   recipe: "chocolate cake"
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     feasible: true,
 *     rating: 4,
 *     explanation: "Almond flour works well in chocolate cake, but use less...",
 *     adjustments: "Use 1/3 less amount and add an extra egg for binding"
 *   }
 * }
 */
exports.validateSubstitution = async (req, res, next) => {
  try {
    const { original, substitute, recipe } = req.body;

    // Validate input
    if (!original || !substitute) {
      return next(
        new AppError("original and substitute fields are required", 400),
      );
    }

    // Validate
    const validationResult = await substitutionService.validateSubstitution(
      original,
      substitute,
      recipe || "",
    );

    return responseHandler.success(res, {
      ...validationResult,
      original,
      substitute,
      recipe: recipe || "general",
    });
  } catch (error) {
    console.error(`❌ Controller Error - validateSubstitution:`, error.message);
    return next(error);
  }
};

/**
 * GET DIET-FRIENDLY SUBSTITUTES
 *
 * Suggest substitutes based on user's allergies or diet preference
 * Examples: "vegan", "keto", "gluten-free", "dairy-free", "nut-free"
 *
 * Query Params:
 * - ingredient (required): Ingredient to substitute
 * - diet (required): Diet type (vegan, keto, gluten-free, etc.)
 * - recipe (optional): Recipe context
 *
 * Example:
 * GET /api/substitutions/diet?ingredient=cream&diet=vegan&recipe=pasta
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     ingredient: "cream",
 *     diet: "vegan",
 *     substitutes: [
 *       { name: "Oat Cream", ratio: "1:1", explanation: "..." },
 *       { name: "Coconut Cream", ratio: "1:1", explanation: "..." }
 *     ]
 *   }
 * }
 */
exports.getDietFriendly = async (req, res, next) => {
  try {
    const { ingredient, diet, recipe } = req.query;

    // Validate input
    if (!ingredient || !diet) {
      return next(
        new AppError("Both ingredient and diet query params are required", 400),
      );
    }

    // Validate diet type (optional - just for logging)
    const validDiets = [
      "vegan",
      "keto",
      "gluten-free",
      "dairy-free",
      "nut-free",
      "paleo",
      "vegetarian",
      "pescatarian",
    ];
    if (!validDiets.includes(diet.toLowerCase())) {
      console.warn(`⚠️ Unknown diet type: ${diet}. Proceeding anyway.`);
    }

    // Get diet-friendly substitutes
    const substitutes = await substitutionService.getSubsByDiet(
      ingredient,
      diet,
      recipe || "",
    );

    return responseHandler.success(res, {
      ingredient,
      diet,
      recipe: recipe || "general",
      substitutes,
      count: substitutes.length,
    });
  } catch (error) {
    console.error(`❌ Controller Error - getDietFriendly:`, error.message);
    return next(error);
  }
};

/**
 * HEALTH CHECK - Test substitution service
 *
 * Used for debugging / admin purposes
 * Verifies Grok API is working
 *
 * GET /api/substitutions/health
 *
 * Returns:
 * {
 *   success: true,
 *   message: "Substitution service healthy",
 *   data: {
 *     service: "substitution",
 *     status: "operational",
 *     grokApi: "connected",
 *     timestamp: "2025-04-07T08:30:00Z"
 *   }
 * }
 */
exports.health = async (req, res, next) => {
  try {
    return responseHandler.success(res, {
      service: "substitution",
      status: "operational",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`❌ Health check error:`, error.message);
    return next(error);
  }
};

/**
 * NEW API: GET ALL SUBSTITUTIONS
 * Returns available ingredients with substitutes
 */
exports.getAllSubstitutions = async (req, res, next) => {
  try {
    const matrix = substitutionService.getAllSubstitutions();
    const ingredients = substitutionService.getAvailableIngredients();

    return responseHandler.success(res, {
      total_ingredients_with_substitutes: ingredients.length,
      available_ingredients: ingredients,
      usage:
        "GET /substitutes/{ingredient} for specific or POST /substitutes/recipe for multiple",
    });
  } catch (error) {
    console.error(`❌ getAllSubstitutions error:`, error.message);
    return next(error);
  }
};

/**
 * NEW API: GET SUBSTITUTES FOR RECIPE
 * Returns substitutes for multiple missing ingredients
 */
exports.getSubstitutesForRecipe = async (req, res, next) => {
  try {
    const { missingIngredients } = req.body;
    const catchAsync = require("../utils/catchAsync");
    const AppError = require("../utils/AppError");

    if (!missingIngredients || !Array.isArray(missingIngredients)) {
      return next(
        new AppError(
          'Provide missingIngredients as an array: {"missingIngredients": ["Paneer", "Turmeric"]}',
          400,
        ),
      );
    }

    if (missingIngredients.length === 0) {
      return next(
        new AppError("missingIngredients array cannot be empty", 400),
      );
    }

    if (missingIngredients.length > 10) {
      return next(
        new AppError(
          "Too many missing ingredients (max 10). Buy them at the store!",
          400,
        ),
      );
    }

    const adjustments = {};
    const unavailable = [];

    // Get substitutes for each ingredient
    for (const ingredient of missingIngredients) {
      const substitutes = substitutionService.getSubstitutes(ingredient, 3);
      if (substitutes.length > 0) {
        adjustments[ingredient] = substitutes;
      } else {
        unavailable.push(ingredient);
      }
    }

    return responseHandler.success(res, {
      message: `Found substitutes for ${Object.keys(adjustments).length} of ${missingIngredients.length} ingredients`,
      substitutes: adjustments,
      unavailable_ingredients: unavailable.length > 0 ? unavailable : null,
      suggestion:
        unavailable.length > 0
          ? `"${unavailable.join('", "')}" don't have known substitutes. Try specialty stores!`
          : "✅ You can now cook with these substitutions!",
    });
  } catch (error) {
    console.error(`❌ getSubstitutesForRecipe error:`, error.message);
    return next(error);
  }
};
