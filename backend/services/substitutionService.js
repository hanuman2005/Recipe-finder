/**
 * SUBSTITUTION SERVICE - Ingredient Swaps Engine (Feature #5)
 *
 * When users don't have a specific ingredient, suggest alternatives:
 * - Similar texture or flavor profile
 * - Common household substitutes
 * - Nutritional equivalents
 * - Cost-effective alternatives
 * - Vegan/dietary alternatives
 *
 * Example:
 *   Missing Paneer? Use: Tofu (or Cottage Cheese)
 *   Missing Paprika? Use: Chili Powder (or Turmeric)
 *   Missing Ghee? Use: Butter (or Coconut Oil)
 */

/**
 * SUBSTITUTION MATRIX
 * Complete mapping of ingredients to their best substitutes
 * Each entry includes: name, ratio, reason, category, notes
 */
const SUBSTITUTION_MATRIX = {
  // DAIRY SUBSTITUTES
  Paneer: [
    {
      name: "Tofu",
      ratio: 1.0,
      reason:
        "Similar firm texture, neutral taste, perfect for stir-fries and curries",
      category: "Protein",
      notes: "May need crisping in pan",
    },
    {
      name: "Cottage Cheese",
      ratio: 0.9,
      reason: "Slightly softer, similar nutritional value, creamy in dishes",
      category: "Dairy",
      notes: "Drain excess moisture first",
    },
    {
      name: "Feta Cheese",
      ratio: 0.8,
      reason: "Firm, crumbly texture, tangy flavor adds complexity",
      category: "Dairy",
      notes: "More pronounced flavor",
    },
  ],

  Ghee: [
    {
      name: "Butter",
      ratio: 0.9,
      reason: "Same cooking properties, slightly different flavor profile",
      category: "Dairy",
      notes: "May burn faster at high heat",
    },
    {
      name: "Coconut Oil",
      ratio: 1.0,
      reason: "Similar smoke point, adds tropical flavor",
      category: "Oil",
      notes: "Vegan-friendly, different taste",
    },
    {
      name: "Vegetable Oil",
      ratio: 1.0,
      reason: "Neutral taste, affordable, good heat tolerance",
      category: "Oil",
      notes: "Less flavorful",
    },
  ],

  Yogurt: [
    {
      name: "Sour Cream",
      ratio: 0.9,
      reason: "Similar consistency and tang, commonly available",
      category: "Dairy",
    },
    {
      name: "Buttermilk",
      ratio: 0.85,
      reason: "Thinner consistency, more sour",
      category: "Dairy",
    },
    {
      name: "Greek Yogurt",
      ratio: 0.7,
      reason: "Thicker, creamier, more protein",
      category: "Dairy",
      notes: "Needs liquid adjustment",
    },
  ],

  // SPICE SUBSTITUTES
  Turmeric: [
    {
      name: "Paprika",
      ratio: 0.8,
      reason: "Similar color, different flavor, less bitter",
      category: "Spice",
    },
    {
      name: "Saffron",
      ratio: 0.25,
      reason: "Similar golden color, more expensive, floral flavor",
      category: "Spice",
      notes: "Much more expensive",
    },
  ],

  Cumin: [
    {
      name: "Coriander",
      ratio: 0.9,
      reason: "Similar warm spice profile, slightly more citrusy",
      category: "Spice",
    },
    {
      name: "Caraway",
      ratio: 0.8,
      reason: "Similar earthiness, slightly different aroma",
      category: "Spice",
    },
  ],

  "Black Pepper": [
    {
      name: "White Pepper",
      ratio: 1.0,
      reason: "Similar heat, milder flavor, better for light-colored dishes",
      category: "Spice",
    },
    {
      name: "Cayenne Pepper",
      ratio: 0.3,
      reason: "Much hotter, use sparingly",
      category: "Spice",
      notes: "Start with ¼ amount",
    },
  ],

  "Chili Powder": [
    {
      name: "Paprika",
      ratio: 0.8,
      reason: "Milder heat, similar color",
      category: "Spice",
    },
    {
      name: "Cayenne Pepper",
      ratio: 0.5,
      reason: "Similar heat level, use less due to intensity",
      category: "Spice",
    },
  ],

  // HERB SUBSTITUTES
  Cilantro: [
    {
      name: "Parsley",
      ratio: 1.0,
      reason: "Similar appearance, milder taste",
      category: "Herb",
    },
    {
      name: "Mint",
      ratio: 0.7,
      reason: "Different flavor but refreshing",
      category: "Herb",
    },
  ],

  Ginger: [
    {
      name: "Galangal",
      ratio: 0.8,
      reason: "Similar appearance and spice level",
      category: "Root",
    },
    {
      name: "Turmeric",
      ratio: 0.5,
      reason: "Different flavor profile, earthy instead of spicy",
      category: "Spice",
    },
  ],

  // VEGETABLE SUBSTITUTES
  Tomato: [
    {
      name: "Red Pepper",
      ratio: 1.0,
      reason: "Similar color and sweetness when cooked",
      category: "Vegetable",
    },
  ],

  Onion: [
    {
      name: "Shallots",
      ratio: 0.9,
      reason: "Similar base flavor, slightly sweeter",
      category: "Vegetable",
    },
    {
      name: "Garlic",
      ratio: 0.3,
      reason: "Different flavor but aromatic base",
      category: "Vegetable",
      notes: "Use much less",
    },
  ],

  // PROTEIN SUBSTITUTES
  Chicken: [
    {
      name: "Tofu",
      ratio: 1.0,
      reason: "Same texture, absorbs flavors well",
      category: "Protein",
    },
    {
      name: "Paneer",
      ratio: 0.9,
      reason: "Firm chunks, Indian cooking staple",
      category: "Protein",
    },
  ],
};

/**
 * GET SUBSTITUTES FOR AN INGREDIENT
 * @param {String} ingredient - Ingredient name (e.g., "Paneer", "Ghee")
 * @param {Number} limit - Max number of suggestions (default: 5)
 * @returns {Array} List of substitute options
 */
function getSubstitutes(ingredient, limit = 5) {
  const substitutes = SUBSTITUTION_MATRIX[ingredient] || [];
  return substitutes.slice(0, limit);
}

/**
 * GET ALL SUBSTITUTIONS
 * @returns {Object} Complete substitution matrix
 */
function getAllSubstitutions() {
  return SUBSTITUTION_MATRIX;
}

/**
 * CHECK IF SUBSTITUTION EXISTS
 * @param {String} ingredient - Ingredient to check
 * @returns {Boolean} True if substitutes are available
 */
function hasSubstitutes(ingredient) {
  return (
    !!SUBSTITUTION_MATRIX[ingredient] &&
    SUBSTITUTION_MATRIX[ingredient].length > 0
  );
}

/**
 * GET INGREDIENTS WITH SUBSTITUTES
 * @returns {Array} List of all ingredients that have substitutes
 */
function getAvailableIngredients() {
  return Object.keys(SUBSTITUTION_MATRIX).sort();
}

module.exports = {
  getSubstitutes,
  getAllSubstitutions,
  hasSubstitutes,
  getAvailableIngredients,
  SUBSTITUTION_MATRIX,
};
