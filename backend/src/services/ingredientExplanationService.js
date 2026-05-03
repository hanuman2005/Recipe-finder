/**
 * INGREDIENT EXPLANATION SERVICE
 *
 * Purpose:
 * Provide detailed explanations of WHY each ingredient is used in a specific recipe
 * Uses ingredient's functionType + recipe context to generate explanations
 *
 * Example:
 * Input: Cream in Alfredo Pasta recipe
 * Output: "Emulsifies with pasta water to create smooth, clingy sauce that coats every strand"
 *
 * This solves user pain point: "Why is this ingredient needed? What does it do?"
 */

const Ingredient = require("../models/Ingredient");
const Recipe = require("../models/Recipe");
const AppError = require("../utils/AppError");

/**
 * GET INGREDIENT EXPLANATION IN RECIPE CONTEXT
 *
 * Takes an ingredient and explains what role it plays in THIS specific recipe
 *
 * @param {String} recipeId - Recipe ID
 * @param {String} ingredientId - Ingredient ID
 * @returns {Promise<Object>} Enhanced ingredient with explanation
 */
const getIngredientExplanation = async (recipeId, ingredientId) => {
  try {
    // Fetch recipe and ingredient
    const recipe = await Recipe.findById(recipeId).populate("ingredients");
    const ingredient = await Ingredient.findById(ingredientId);

    if (!recipe) {
      throw new AppError("Recipe not found", 404);
    }

    if (!ingredient) {
      throw new AppError("Ingredient not found", 404);
    }

    // Find this ingredient in recipe
    const recipeIngredient = recipe.ingredients.find(
      (ing) => ing._id.toString() === ingredientId.toString(),
    );

    if (!recipeIngredient) {
      throw new AppError("Ingredient not in this recipe", 404);
    }

    // Generate explanation based on function type
    const explanation = generateExplanation(
      ingredient,
      recipe.title,
      recipeIngredient,
      recipe.category,
    );

    return {
      _id: ingredient._id,
      name: ingredient.name,
      quantity: recipeIngredient.quantity,
      unit: recipeIngredient.unit,
      image: ingredient.image,
      functionType: ingredient.functionType || "Flavoring",
      explanation: explanation,
      whyNeeded: `${ingredient.functionType} ${getColorfulExplanation(ingredient.functionType)}`,
      replacements: ingredient.substitutes ? ingredient.substitutes.length : 0,
      nutritionPer100g: ingredient.nutritionPer100g,
    };
  } catch (error) {
    console.error("❌ Error getting ingredient explanation:", error.message);
    throw error;
  }
};

/**
 * GET ALL INGREDIENTS WITH EXPLANATIONS FOR A RECIPE
 *
 * Returns all ingredients in a recipe with detailed explanations
 * Perfect for recipe detail page
 *
 * @param {String} recipeId - Recipe ID
 * @returns {Promise<Array>} Array of ingredients with explanations
 */
const getRecipeIngredientsWithExplanations = async (recipeId) => {
  try {
    const recipe = await Recipe.findById(recipeId).populate("ingredients");

    if (!recipe) {
      throw new AppError("Recipe not found", 404);
    }

    const ingredientsWithExplanations = await Promise.all(
      recipe.ingredients.map((ingredient) =>
        getIngredientExplanation(recipeId, ingredient._id),
      ),
    );

    return ingredientsWithExplanations;
  } catch (error) {
    console.error("❌ Error getting recipe ingredients:", error.message);
    throw error;
  }
};

/**
 * GENERATE EXPLANATION BASED ON FUNCTION TYPE
 *
 * Creates a human-friendly explanation specific to the recipe and ingredient role
 */
const generateExplanation = (
  ingredient,
  recipeName,
  recipeIngredient,
  category,
) => {
  const functionType = ingredient.functionType || "Flavoring";

  const explanations = {
    Base: `${ingredient.name} forms the foundation of ${recipeName}, providing structure and body to the dish. Without it, ${recipeName} would lack its characteristic texture and substance.`,

    Protein: `${ingredient.name} is the main protein source in this recipe. It provides essential nutrients and keeps you feeling full longer. The protein molecules also help create texture and structure when cooked.`,

    Fat: `${ingredient.name} adds richness and helps carry flavors throughout ${recipeName}. The fat molecules coat your taste buds, making flavors more intense. It's also essential for absorbing fat-soluble vitamins.`,

    Binder: `${ingredient.name} holds all the ingredients together in ${recipeName}. It creates a cohesive texture and prevents the dish from falling apart. Removing it would result in a crumbly, incomplete texture.`,

    Thickener: `${ingredient.name} thickens the sauce in ${recipeName}, giving it the right consistency. Without it, the sauce would be too thin and wouldn't coat the other ingredients properly.`,

    Flavoring: `${ingredient.name} is the main seasoning in ${recipeName}. It adds depth and character to the dish. Every cuisine has its signature flavorings, and this one defines the ${category || "regional"} profile of this recipe.`,

    Liquid: `${ingredient.name} adds moisture and is essential for cooking the other ingredients in ${recipeName}. It also carries heat and helps dissolve and distribute flavors evenly.`,

    Acid: `${ingredient.name} adds brightness and freshness to ${recipeName}, balancing any richness from fats. It also brings out other flavors, making the dish taste more vibrant and complete.`,

    Sweetener: `${ingredient.name} balances flavors in ${recipeName}, especially if there are bitter or salty elements. When cooked, it may caramelize, adding depth and complexity to the taste.`,

    Texture: `${ingredient.name} provides textural contrast in ${recipeName}. It adds crunch, chewiness, or substance, making each bite more interesting and preventing the dish from becoming one-dimensional.`,
  };

  return (
    explanations[functionType] ||
    `${ingredient.name} plays an important role in ${recipeName} by adding ${functionType.toLowerCase()}.`
  );
};

/**
 * GET COLORFUL FUNCTION DESCRIPTION
 *
 * Returns emoji + description for UI display
 */
const getColorfulExplanation = (functionType) => {
  const descriptions = {
    Base: "🥄 Foundation ingredient",
    Protein: "🥚 Builds your muscles",
    Fat: "🧈 Adds richness & flavor",
    Binder: "🔗 Holds it together",
    Thickener: "⬆️ Creates the texture",
    Flavoring: "🌶️ Adds the taste",
    Liquid: "💧 Adds moisture",
    Acid: "🍋 Adds brightness",
    Sweetener: "🍯 Balances flavors",
    Texture: "🥜 Adds crunch",
  };

  return descriptions[functionType] || "✨ Essential ingredient";
};

/**
 * WHY EACH INGREDIENT MATTERS
 *
 * Educational details about ingredient importance
 */
const getIngredientImportance = (functionType) => {
  const importance = {
    Base: "Too little: Dish loses structure. Too much: Becomes dense and boring.",
    Protein:
      "Look for quality here - it affects nutrition and taste significantly.",
    Fat: "Quality matters! Use the best quality you can afford.",
    Binder: "Critical for texture - cannot be replaced randomly.",
    Thickener:
      "Exact amount matters - too little is watery, too much is gluey.",
    Flavoring:
      "This is where you can adjust to taste - start with less, add more.",
    Liquid: "Amount affects cooking time and final consistency.",
    Acid: "Adds pop! Often added at the end for maximum freshness.",
    Sweetener: "Small amounts go a long way - add gradually.",
    Texture: "Adds personality - fresh vs toasted makes a difference.",
  };

  return importance[functionType] || "Important component of this recipe.";
};

/**
 * SKILL LEVEL - WHICH INGREDIENTS ARE TRICKY?
 */
const getIngredientDifficulty = (functionType) => {
  const difficulty = {
    Base: "Easy",
    Protein: "Medium",
    Fat: "Easy",
    Binder: "Hard",
    Thickener: "Medium",
    Flavoring: "Medium",
    Liquid: "Easy",
    Acid: "Easy",
    Sweetener: "Medium",
    Texture: "Easy",
  };

  return difficulty[functionType] || "Medium";
};

// ========== EXPORT SERVICE ==========
module.exports = {
  getIngredientExplanation,
  getRecipeIngredientsWithExplanations,
  generateExplanation,
  getColorfulExplanation,
  getIngredientImportance,
  getIngredientDifficulty,
};
