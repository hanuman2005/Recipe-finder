/**
 * INGREDIENT CONTROLLER - HTTP Request Handlers for Ingredients
 *
 * Purpose:
 * - Handle ingredient API requests (search, view, get image, etc)
 * - Ingredient glossary endpoints for frontend
 * - Supply ingredient data for substitution suggestions
 *
 * Routes:
 * GET /api/ingredients/:id - Get single ingredient with image
 * GET /api/ingredients/search/:query - Search ingredients
 * GET /api/ingredients/category/:category - Get by category
 * GET /api/ingredients/trending - Get trending ingredients
 * GET /api/ingredients/:name/image - Get ingredient image URL
 * GET /api/ingredients/:name/substitutes - Get possible substitutes
 * GET /api/ingredients/:name/details - Full ingredient details (regional names, where to buy, etc)
 */

const ingredientService = require('../services/ingredientService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/responseHandler');

/**
 * GET SINGLE INGREDIENT BY ID
 * Route: GET /api/ingredients/:id
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/507f1f77bcf86cd799439011
 *
 * Response:
 * {
 *   name: "Paneer",
 *   images: { primary: "url", alternatives: [...], accessibility_description: "..." },
 *   regional_names: { ta: ["panir"], hi: ["paneer"] },
 *   category: "Dairy",
 *   description: "Fresh Indian cheese...",
 *   where_to_buy: ["Indian grocery stores", ...],
 *   cooking_tips: ["Add at end to prevent breaking", ...],
 *   substitutes: [{ name: "Tofu", ratio: 1, notes: "..." }, ...]
 * }
 */
const getIngredient = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Find ingredient by MongoDB ObjectId
  const ingredient = await ingredientService.findByNameOrAlias(id);

  if (!ingredient) {
    throw new AppError('Ingredient not found', 404);
  }

  // Populate substitute details
  await ingredient.populate('substitutes.ingredient_id');

  return successResponse(res, {
    message: 'Ingredient retrieved successfully',
    data: ingredient,
  });
});

/**
 * SEARCH INGREDIENTS
 * Route: GET /api/ingredients/search?query=paneer
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/search?query=paneer
 * // User typing in ingredient glossary search
 *
 * GET /api/ingredients/search?query=dairy
 * // Search for all dairy ingredients
 *
 * Returns: [
 *   { name: "Paneer", images: {...}, category: "Dairy" },
 *   { name: "Ricotta", images: {...}, category: "Dairy", notes: "Italian substitute for paneer" }
 * ]
 *
 * @query {String} query - Search term (required)
 * @query {String} category - Filter by category (optional)
 */
const searchIngredients = catchAsync(async (req, res) => {
  const { query, category } = req.query;

  if (!query || query.trim().length < 2) {
    throw new AppError(
      'Search query must be at least 2 characters',
      400
    );
  }

  // Search ingredients
  const ingredients = await ingredientService.searchIngredients(query);

  // Filter by category if provided
  let results = ingredients;
  if (category) {
    results = ingredients.filter(
      (ing) => ing.category.toLowerCase() === category.toLowerCase()
    );
  }

  return successResponse(res, {
    message: `Found ${results.length} ingredients matching "${query}"`,
    data: results,
    count: results.length,
  });
});

/**
 * GET INGREDIENTS BY CATEGORY
 * Route: GET /api/ingredients/category/:category
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/category/Dairy
 * // Returns all dairy ingredients for ingredient glossary
 *
 * GET /api/ingredients/category/Spice
 * // Returns all spices for browsing
 *
 * Response:
 * {
 *   category: "Dairy",
 *   ingredients: [
 *     { name: "Paneer", images: {...}, where_to_buy: [...] },
 *     { name: "Yogurt", images: {...}, where_to_buy: [...] }
 *   ]
 * }
 */
const getByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;

  // Validate category
  const validCategories = [
    'Protein',
    'Dairy',
    'Spice',
    'Grain',
    'Vegetable',
    'Fruit',
    'Oil',
    'Legume',
    'Herb',
    'Seasoning',
    'Leavening',
    'Sweetener',
    'Acid',
    'Other',
  ];

  if (!validCategories.includes(category)) {
    throw new AppError(
      `Invalid category. Valid categories: ${validCategories.join(', ')}`,
      400
    );
  }

  const ingredients = await ingredientService.getByCategory(category);

  return successResponse(res, {
    message: `${ingredients.length} ingredients found in category "${category}"`,
    data: {
      category,
      ingredients,
      count: ingredients.length,
    },
  });
});

/**
 * GET TRENDING INGREDIENTS
 * Route: GET /api/ingredients/trending?limit=10
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/trending
 * // Top 10 most-used ingredients in recipes (default)
 *
 * GET /api/ingredients/trending?limit=5
 * // Top 5 trending ingredients for homepage feature
 *
 * Response:
 * [
 *   { name: "Chicken", usage_count: 245, images: {...} },
 *   { name: "Tomato", usage_count: 198, images: {...} },
 *   { name: "Paneer", usage_count: 156, images: {...} }
 * ]
 *
 * Use cases:
 * - "Popular ingredients this week" section
 * - Ingredient recommendations
 * - Analytics dashboard
 */
const getTrending = catchAsync(async (req, res) => {
  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 10, 1),
    100
  ); // 1-100

  const ingredients = await ingredientService.getTrendingIngredients(limit);

  return successResponse(res, {
    message: `Top ${limit} trending ingredients`,
    data: ingredients,
    count: ingredients.length,
  });
});

/**
 * GET INGREDIENT IMAGE
 * Route: GET /api/ingredients/:name/image
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/paneer/image
 * // Returns: { url: "https://images.unsplash.com/..." }
 *
 * Use cases:
 * - When clicking ingredient name in recipe, show image
 * - Ingredient glossary UI
 * - Substitution screen: show images side-by-side
 *
 * Response:
 * {
 *   ingredient: "Paneer",
 *   image: "https://images.unsplash.com/photo-xxx",
 *   accessibility_description: "White cube-shaped cheese..."
 * }
 */
const getIngredientImage = catchAsync(async (req, res) => {
  const { name } = req.params;

  const ingredient = await ingredientService.findByNameOrAlias(name);

  if (!ingredient) {
    throw new AppError(
      `Ingredient "${name}" not found in glossary`,
      404
    );
  }

  return successResponse(res, {
    message: 'Ingredient image retrieved',
    data: {
      ingredient: ingredient.name,
      image: ingredient.images?.primary,
      alternatives: ingredient.images?.alternatives,
      accessibility_description:
        ingredient.images?.accessibility_description,
    },
  });
});

/**
 * GET SUBSTITUTES FOR INGREDIENT (Core Feature #1)
 * Route: GET /api/ingredients/:name/substitutes
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/paneer/substitutes
 * // When user missing "Paneer", show what to use instead
 *
 * Response:
 * {
 *   ingredient: "Paneer",
 *   substitutes: [
 *     {
 *       name: "Tofu",
 *       image: "https://...",
 *       ratio: 1,
 *       notes: "Silken tofu has similar texture...",
 *       best_for: "similar_texture",
 *       why_works: "..."
 *     },
 *     {
 *       name: "Cottage Cheese",
 *       image: "https://...",
 *       ratio: 0.8,
 *       notes: "Denser than paneer, less liquid...",
 *       best_for: "similar_taste",
 *       why_works: "..."
 *     }
 *   ]
 * }
 *
 * Core of Feature 1: Dynamic Substitution Engine
 * When user sees recipe with missing ingredient "Paneer":
 * 1. Call GET /api/ingredients/paneer/substitutes
 * 2. Show options with images
 * 3. User picks: "I have Tofu"
 * 4. Recipe automatically adjusts quantity (1:1 ratio)
 * 5. User follows modified recipe
 */
const getSubstitutes = catchAsync(async (req, res) => {
  const { name } = req.params;

  const ingredient = await ingredientService.findByNameOrAlias(name);

  if (!ingredient) {
    throw new AppError(
      `Ingredient "${name}" not found`,
      404
    );
  }

  const substitutes = await ingredientService.getSubstitutes(name);

  return successResponse(res, {
    message: `Found ${substitutes.length} substitute options for "${name}"`,
    data: {
      ingredient: ingredient.name,
      image: ingredient.images?.primary,
      substitutes,
      count: substitutes.length,
    },
  });
});

/**
 * GET FULL INGREDIENT DETAILS
 * Route: GET /api/ingredients/:name/details
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/paneer/details
 * // Complete ingredient information for glossary view
 *
 * Response:
 * {
 *   name: "Paneer",
 *   images: { primary: "...", alternatives: [...] },
 *   regional_names: { ta: ["panir"], hi: ["paneer"], bn: ["chenna"] },
 *   category: "Dairy",
 *   description: "Fresh Indian cottage cheese...",
 *   where_to_buy: ["Indian grocery stores", "Whole Foods", "Online: Amazon Fresh"],
 *   cooking_tips: ["Add at end", "Press beforehand", "Marinate in yogurt"],
 *   storage: {
 *     refrigerator: { duration: "5-7 days", instructions: "In brine" },
 *     freezer: { duration: "1 month", instructions: "Wrap tightly" }
 *   },
 *   health_info: {
 *     calories_per_100g: 265,
 *     protein_per_100g: 25.2,
 *     common_allergens: ["dairy"],
 *     vegan_alternatives: ["Tofu", "Tempeh"]
 *   },
 *   substitutes: [{ name: "Tofu", ... }, ...]
 * }
 *
 * Use cases:
 * - Ingredient glossary detailed view
 * - Clicking ingredient name shows full info
 * - Shopping guides and storage tips
 * - Health/allergen information for dietary restrictions
 */
const getIngredientDetails = catchAsync(async (req, res) => {
  const { name } = req.params;

  const ingredient = await ingredientService.getIngredientWithSubstitutes(
    name
  );

  if (!ingredient) {
    throw new AppError(
      `Ingredient "${name}" not found in glossary`,
      404
    );
  }

  return successResponse(res, {
    message: 'Ingredient details retrieved',
    data: ingredient,
  });
});

/**
 * GET REGIONAL NAMES FOR INGREDIENT
 * Route: GET /api/ingredients/:name/regional-names
 * Auth: Public
 *
 * Usage:
 * GET /api/ingredients/paneer/regional-names
 *
 * Response:
 * {
 *   ingredient: "Paneer",
 *   regional_names: {
 *     en: ["Paneer", "Indian cheese"],
 *     hi: ["Paneer", "Chenna paneer"],
 *     ta: ["Panir", "Pani"],
 *     bn: ["Chenna"],
 *     it: ["Ricotta"]
 *   }
 * }
 *
 * This helps:
 * - Show user "In Tamil Nadu, this is called 'panir'"
 * - Accessibility: Screen readers can say all names
 * - Shopping guides: "Look for 'paneer' or 'chenna' in dairy section"
 * - Recipe adaptation for international users
 */
const getRegionalNames = catchAsync(async (req, res) => {
  const { name } = req.params;

  const ingredient = await ingredientService.findByNameOrAlias(name);

  if (!ingredient) {
    throw new AppError(
      `Ingredient "${name}" not found`,
      404
    );
  }

  return successResponse(res, {
    message: 'Regional names retrieved',
    data: {
      ingredient: ingredient.name,
      regional_names: ingredient.regional_names,
      accessibility_description:
        ingredient.images?.accessibility_description,
    },
  });
});

// ========== EXPORT CONTROLLER METHODS ==========
module.exports = {
  getIngredient,
  searchIngredients,
  getByCategory,
  getTrending,
  getIngredientImage,
  getSubstitutes,
  getIngredientDetails,
  getRegionalNames,
};
