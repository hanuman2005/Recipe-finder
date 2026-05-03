/**
 * INGREDIENT SERVICE - Centralized Ingredient Management
 *
 * Purpose:
 * - Handle all ingredient CRUD operations
 * - Fetch ingredient images from Unsplash API
 * - Find ingredients by name, regional names, category
 * - Manage ingredient substitutions
 * - Support ingredient glossary feature
 *
 * Usage in other services:
 * const ingredientService = require('./ingredientService');
 * const paneer = await ingredientService.findByNameOrAlias('paneer');
 * const image = await ingredientService.getIngredientImage('paneer');
 */

const Ingredient = require('../models/Ingredient');
const AppError = require('../utils/AppError');

/**
 * ========== UNSPLASH API CONFIGURATION ==========
 * Free image API for fetching ingredient photos
 * Alternative: Use Unsplash API key if you have one for production use
 *
 * For demo: Using hardcoded image URLs from Unsplash
 * For production: Implement Unsplash API client with rate limiting
 *
 * Free Unsplash API:
 * - Rate limit: 50 requests/hour without API key
 * - With API key: 5000 requests/hour
 * - Documentation: https://unsplash.com/developers
 */

const UNSPLASH_API_BASE = 'https://api.unsplash.com';
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY || 'demo_key_use_for_development';

/**
 * Public URLs for common ingredients (fallback if API fails)
 * These are permanent Unsplash URLs for essential cooking ingredients
 */
const DEFAULT_INGREDIENT_IMAGES = {
  paneer:
    'https://images.unsplash.com/photo-1645189215126-cc9f2e6b7b84?w=500&h=500&fit=crop', // Fresh paneer blocks
  tofu: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop', // Tofu blocks
  'cottage cheese':
    'https://images.unsplash.com/photo-1465014392862-4e63e0aa368c?w=500&h=500&fit=crop', // Cottage cheese
  chicken:
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=500&fit=crop', // Raw chicken
  rice: 'https://images.unsplash.com/photo-1609137144813-a3fb33333606?w=500&h=500&fit=crop', // Rice grains
  milk: 'https://images.unsplash.com/photo-1563056169-519f5b94a0a8?w=500&h=500&fit=crop', // Milk glass
  butter:
    'https://images.unsplash.com/photo-1627873649417-af0b4cb2a11f?w=500&h=500&fit=crop', // Butter
  salt: 'https://images.unsplash.com/photo-1599599810694-d6e9f1d68a53?w=500&h=500&fit=crop', // Salt
  pepper:
    'https://images.unsplash.com/photo-1596040124506-f0c7d9af14d0?w=500&h=500&fit=crop', // Black pepper
  garlic:
    'https://images.unsplash.com/photo-1596040124506-f0c7d9af14d0?w=500&h=500&fit=crop', // Garlic cloves
  onion: 'https://images.unsplash.com/photo-1588137901346-cf0ee2e89fca?w=500&h=500&fit=crop', // Onion
  tomato:
    'https://images.unsplash.com/photo-1592921570552-8ac40e8155bc?w=500&h=500&fit=crop', // Fresh tomato
  coriander:
    'https://images.unsplash.com/photo-1599599810694-d6e9f1d68a53?w=500&h=500&fit=crop', // Coriander powder
  turmeric:
    'https://images.unsplash.com/photo-1599599810694-d6e9f1d68a53?w=500&h=500&fit=crop', // Turmeric powder
  ginger:
    'https://images.unsplash.com/photo-1559383331-c895bc18bcad?w=500&h=500&fit=crop', // Ginger root
};

/**
 * ========== SERVICE METHODS ==========
 */

/**
 * CREATE NEW INGREDIENT
 *
 * Usage:
 * const newIngredient = await ingredientService.createIngredient({
 *   name: 'Paneer',
 *   category: 'Dairy',
 *   description: 'Fresh Indian cheese...',
 *   images: { primary: 'url', accessibility_description: 'White cube...' },
 *   regional_names: { ta: ['panir'], hi: ['paneer'], bn: ['chenna'] }
 * });
 *
 * Validation:
 * - Name must be unique (no duplicates)
 * - Category must be from enum
 * - Images must have primary URL
 *
 * @param {Object} ingredientData - Ingredient document data
 * @returns {Promise<Object>} Created ingredient document
 * @throws {AppError} If validation fails or duplicate name
 */
const createIngredient = async (ingredientData) => {
  try {
    // Check if ingredient already exists (case-insensitive)
    const existingIngredient = await Ingredient.findOne({
      name: { $regex: new RegExp(`^${ingredientData.name}$`, 'i') },
    });

    if (existingIngredient) {
      throw new AppError(
        `Ingredient "${ingredientData.name}" already exists`,
        400
      );
    }

    // Create new ingredient
    const ingredient = await Ingredient.create(ingredientData);

    return ingredient;
  } catch (error) {
    throw new AppError(
      error.message || 'Error creating ingredient',
      error.statusCode || 500
    );
  }
};

/**
 * FIND INGREDIENT BY NAME OR REGIONAL ALIAS
 *
 * Usage:
 * const ingredient = await ingredientService.findByNameOrAlias('panir');
 * // Returns ingredient with name 'Paneer' (because Tamil: panir)
 *
 * This enables:
 * - Users searching for regional names find the main ingredient
 * - Recipe search works across regional borders
 * - User convenience: "panir" finds "Paneer"
 *
 * @param {String} searchName - Ingredient name or regional alias to search for
 * @returns {Promise<Object>} Ingredient document with search term OR null
 */
const findByNameOrAlias = async (searchName) => {
  return await Ingredient.findByNameOrAlias(searchName);
};

/**
 * GET INGREDIENT WITH FULL SUBSTITUTE DETAILS
 *
 * Usage:
 * const paneer = await ingredientService.getIngredientWithSubstitutes('paneer');
 * // Returns:
 * // {
 * //   name: 'Paneer',
 * //   images: { primary: 'url', ... },
 * //   substitutes: [
 * //     { name: 'Tofu', ratio: 1, notes: '...', best_for: 'similar_texture' },
 * //     { name: 'Cottage Cheese', ratio: 1, notes: '...', best_for: 'similar_taste' }
 * //   ]
 * // }
 *
 * When user sees missing ingredient "Paneer", this shows what they can use instead
 *
 * @param {String} ingredientName - Name of ingredient to find
 * @returns {Promise<Object>} Full ingredient with populated substitutes
 */
const getIngredientWithSubstitutes = async (ingredientName) => {
  const ingredient = await findByNameOrAlias(ingredientName);

  if (!ingredient) {
    return null;
  }

  // Populate substitute ingredient references with full data
  await ingredient.populate('substitutes.ingredient_id');

  return ingredient;
};

/**
 * GET INGREDIENT IMAGE URL
 *
 * Usage:
 * const imageUrl = await ingredientService.getIngredientImage('paneer');
 * // Returns: 'https://images.unsplash.com/photo-xxx'
 *
 * Returns Unsplash image URL for displaying in UI:
 * - RecipeDetails: Show ingredient image when user clicks on ingredient name
 * - Ingredient Glossary: Display ingredient images + descriptions
 * - Substitution screen: Show images side-by-side (paneer vs tofu vs cottage cheese)
 *
 * @param {String} ingredientName - Name of ingredient
 * @returns {Promise<String>} URL to ingredient image OR null
 */
const getIngredientImage = async (ingredientName) => {
  // First check if we have ingredient in DB
  const ingredient = await findByNameOrAlias(ingredientName);

  if (ingredient && ingredient.images?.primary) {
    return ingredient.images.primary;
  }

  // Fallback to default images if ingredient not in DB
  const defaultImage = DEFAULT_INGREDIENT_IMAGES[ingredientName.toLowerCase()];
  if (defaultImage) {
    return defaultImage;
  }

  // If still no image, return null (UI will show placeholder)
  return null;
};

/**
 * GET ALL INGREDIENTS BY CATEGORY
 *
 * Usage:
 * const dairyIngredients = await ingredientService.getByCategory('Dairy');
 * // Returns: [Paneer, Yogurt, Buttermilk, Ghee, ...]
 *
 * Use cases:
 * - Build ingredient filter UI
 * - Show "Similar ingredients" suggestions
 * - Organize ingredient glossary by category
 *
 * @param {String} category - Category name (Dairy, Spice, Vegetable, etc)
 * @returns {Promise<Array>} Ingredients in that category
 */
const getByCategory = async (category) => {
  return await Ingredient.find({ category });
};

/**
 * SEARCH INGREDIENTS
 *
 * Usage:
 * const results = await ingredientService.searchIngredients('dairy');
 * // Returns ingredients matching "dairy" in name or description
 *
 * For ingredient glossary search UI:
 * User types "paneer" or "panir" or "ricotta" → finds Paneer
 *
 * @param {String} query - Search query
 * @returns {Promise<Array>} Matching ingredients
 */
const searchIngredients = async (query) => {
  return await Ingredient.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
    ],
  });
};

/**
 * GET TRENDING INGREDIENTS
 *
 * Usage:
 * const trending = await ingredientService.getTrendingIngredients(10);
 * // Returns: [Chicken, Tomato, Paneer, Rice, ...] (most used first)
 *
 * Use cases:
 * - "Popular ingredients" section on homepage
 * - Recommend ingredients to users
 * - Analytics dashboard showing most-used ingredients
 *
 * @param {Number} limit - How many to return (default 10)
 * @returns {Promise<Array>} Top used ingredients
 */
const getTrendingIngredients = async (limit = 10) => {
  return await Ingredient.getTrending(limit);
};

/**
 * INCREMENT INGREDIENT USAGE COUNT
 *
 * Usage:
 * After recipe created with paneer, call:
 * await ingredientService.incrementUsageCount('Paneer');
 *
 * Tracks usage statistics for:
 * - Trending ingredients feature
 * - Recommendations to users
 * - Analytics on most-used ingredients in recipes
 *
 * @param {String} ingredientName - Name of ingredient
 * @returns {Promise<Object>} Updated ingredient with new usage count
 */
const incrementUsageCount = async (ingredientName) => {
  const ingredient = await findByNameOrAlias(ingredientName);

  if (ingredient) {
    ingredient.usage_count = (ingredient.usage_count || 0) + 1;
    await ingredient.save();
  }

  return ingredient;
};

/**
 * GET SUBSTITUTE OPTIONS FOR INGREDIENT
 *
 * Usage:
 * const substitutes = await ingredientService.getSubstitutes('Paneer');
 * // Returns: [ { name: 'Tofu', ratio: 1, notes: '...', best_for: 'similar_texture' }, ... ]
 *
 * Core of Feature #1: Dynamic Substitution Engine
 * When user missing "Paneer", this shows what they can use instead with:
 * - Name of substitute
 * - Ratio (how much to use: 1:1, 2:1, etc)
 * - Why it works and how to adjust recipe
 * - Category: similar_texture vs similar_taste vs vegan vs healthier
 *
 * Frontend shows options sorted by best_for category
 *
 * @param {String} ingredientName - Name of ingredient to find substitutes for
 * @returns {Promise<Array>} Array of substitute options with details
 */
const getSubstitutes = async (ingredientName) => {
  const ingredient = await getIngredientWithSubstitutes(ingredientName);

  if (!ingredient || !ingredient.substitutes) {
    return [];
  }

  // Format substitutes for frontend display
  return ingredient.substitutes.map((sub) => ({
    id: sub.ingredient_id._id,
    name: sub.ingredient_id.name,
    image: sub.ingredient_id.images?.primary,
    ratio: sub.ratio,
    notes: sub.notes,
    best_for: sub.best_for,
    why_works: sub.notes, // Explanation for substitution
  }));
};

/**
 * ADD SUBSTITUTE FOR INGREDIENT
 *
 * Usage:
 * After creating Tofu ingredient:
 * await ingredientService.addSubstitute('Paneer', 'Tofu', 1, 'Silken tofu...', 'similar_texture');
 *
 * Builds the substitution network:
 * Paneer → [Tofu, Cottage Cheese, Feta, Ricotta]
 * Tofu → [Paneer, Tempeh, Seitan]
 *
 * @param {String} ingredientName - Ingredient we're adding substitute to
 * @param {String} substituteName - Name of substitute ingredient
 * @param {Number} ratio - Ratio (1 = 1:1, 2 = 2:1, etc)
 * @param {String} notes - Why & how to substitute
 * @param {String} bestFor - Category (similar_texture, similar_taste, vegan, etc)
 * @returns {Promise<Object>} Updated ingredient
 */
const addSubstitute = async (
  ingredientName,
  substituteName,
  ratio = 1,
  notes = '',
  bestFor = 'similar_texture'
) => {
  const ingredient = await findByNameOrAlias(ingredientName);
  const substitute = await findByNameOrAlias(substituteName);

  if (!ingredient || !substitute) {
    throw new AppError(
      'Ingredient or substitute ingredient not found',
      404
    );
  }

  // Check if this substitute already exists
  const alreadyExists = ingredient.substitutes.some(
    (s) => s.ingredient_id.toString() === substitute._id.toString()
  );

  if (alreadyExists) {
    throw new AppError(
      `${substituteName} is already a substitute for ${ingredientName}`,
      400
    );
  }

  // Add new substitute
  ingredient.substitutes.push({
    ingredient_id: substitute._id,
    ratio,
    notes,
    best_for: bestFor,
  });

  await ingredient.save();
  return ingredient;
};

/**
 * GET INGREDIENTS FOR RECIPE
 *
 * Usage:
 * const recipeIngredients = await ingredientService.getRecipeIngredients(recipeDoc);
 *
 * Takes a recipe document with ingredient ObjectId references and:
 * 1. Populates the ingredient references with full data
 * 2. Returns formatted ingredient objects with images and substitutes
 *
 * This is called when displaying recipe details to show:
 * - Ingredient name
 * - Image
 * - Quantity + unit
 * - Available substitutes
 * - Where to buy
 *
 * @param {Object} recipe - Recipe document (must have ingredients array with ObjectId refs)
 * @returns {Promise<Array>} Ingredients with full details (name, image, substitutes, etc)
 */
const getRecipeIngredients = async (recipe) => {
  if (!recipe.ingredients) {
    return [];
  }

  // Populate ingredient references from the recipe
  await recipe.populate('ingredients.ingredient');

  // Format ingredients for frontend
  return recipe.ingredients.map((ing) => ({
    _id: ing._id,
    ingredient_id: ing.ingredient._id,
    name: ing.ingredient.name,
    quantity: ing.quantity,
    unit: ing.unit,
    functionType: ing.functionType,
    notes: ing.notes,
    // Include ingredient details
    image: ing.ingredient.images?.primary,
    category: ing.ingredient.category,
    regional_names: ing.ingredient.regional_names,
    where_to_buy: ing.ingredient.where_to_buy,
    cooking_tips: ing.ingredient.cooking_tips,
  }));
};

// ========== EXPORT SERVICE METHODS ==========
module.exports = {
  createIngredient,
  findByNameOrAlias,
  getIngredientWithSubstitutes,
  getIngredientImage,
  getByCategory,
  searchIngredients,
  getTrendingIngredients,
  incrementUsageCount,
  getSubstitutes,
  addSubstitute,
  getRecipeIngredients,
};
