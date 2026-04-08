/**
 * INGREDIENT ROUTES - Ingredient API Endpoints
 *
 * Purpose:
 * - Define all routes for ingredient operations
 * - Support ingredient glossary feature
 * - Provide substitution data for Feature #1
 *
 * Route Summary:
 * GET    /api/ingredients/:id                    - Get ingredient by ID
 * GET    /api/ingredients/search?query=...      - Search ingredients
 * GET    /api/ingredients/category/:category    - Get ingredients by category
 * GET    /api/ingredients/trending              - Get trending ingredients
 * GET    /api/ingredients/:name/image           - Get ingredient image URL
 * GET    /api/ingredients/:name/substitutes     - Get substitute options (Feature #1)
 * GET    /api/ingredients/:name/details         - Get full ingredient details
 * GET    /api/ingredients/:name/regional-names  - Get regional name variations
 */

const express = require("express");
const ingredientController = require("../controllers/ingredientController");
const { searchLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

// ========== RATE LIMITING ==========
// Rate limiter for ingredient search (prevent abuse)
// Using searchLimiter: 60 requests per 1 minute

// ========== PUBLIC ROUTES (No Authentication Required) ==========
// All ingredient routes are public - users need to browse ingredients

/**
 * GET /api/ingredients/search?query=paneer
 * Search for ingredients by name, description, or category
 *
 * Use case:
 * User typing in ingredient glossary search box
 * "Find paneer" → Returns matching ingredients with images
 *
 * Rate limited: 100 requests per hour
 */
router.get("/search", searchLimiter, ingredientController.searchIngredients);

/**
 * GET /api/ingredients/category/Dairy
 * Get all ingredients in a specific category
 *
 * Use case:
 * Ingredient glossary showing "All Dairy Products"
 *
 * Valid categories:
 * - Protein, Dairy, Spice, Grain, Vegetable, Fruit
 * - Oil, Legume, Herb, Seasoning, Leavening, Sweetener, Acid, Other
 */
router.get("/category/:category", ingredientController.getByCategory);

/**
 * GET /api/ingredients/trending?limit=10
 * Get trending/most-used ingredients
 *
 * Use case:
 * "Popular ingredients this week" section on homepage
 * Default limit: 10, Max: 100
 */
router.get("/trending", ingredientController.getTrending);

/**
 * GET /api/ingredients/:name/image
 * Get ingredient image URL
 *
 * Use case:
 * When user clicks ingredient name in recipe:
 * 1. Shows image
 * 2. Shows accessibility description (for screen readers)
 * 3. Shows alternative forms (whole, powder, etc)
 *
 * Returns {
 *   ingredient: "Paneer",
 *   image: "https://images.unsplash.com/...",
 *   accessibility_description: "White cube-shaped cheese...",
 *   alternatives: [{ label: "shredded", url: "..." }, ...]
 * }
 */
router.get("/:name/image", ingredientController.getIngredientImage);

/**
 * GET /api/ingredients/:name/substitutes
 * core of Feature #1: Dynamic Substitution Engine
 *
 * Returns possible substitutes when user missing ingredient
 * Example: User missing "Paneer" → Returns [Tofu, Cottage Cheese, Feta, Ricotta]
 * Each with ratio, notes, and why it works
 *
 * Use case:
 * 1. User views recipe - sees missing "Paneer"
 * 2. App calls GET /api/ingredients/paneer/substitutes
 * 3. Shows options with images side-by-side:
 *    [Tofu (1:1 ratio)] [Cottage Cheese (0.8:1)] [Feta (1:1)]
 * 4. User clicks one → Recipe adjusts
 * 5. User can now cook!
 *
 * This is the core Feature 1 that prevents "user gives up" moments
 */
router.get("/:name/substitutes", ingredientController.getSubstitutes);

/**
 * GET /api/ingredients/:name/regional-names
 * Get regional name variations for ingredient
 *
 * Use case:
 * Show user: "In Tamil Nadu, this is called 'panir'"
 * Helps international users recognize ingredients they know by different names
 *
 * Returns {
 *   ingredient: "Paneer",
 *   regional_names: {
 *     en: ["Paneer", "Indian cheese"],
 *     ta: ["Panir"],
 *     hi: ["Paneer"],
 *     bn: ["Chenna"],
 *     it: ["Ricotta"]
 *   }
 * }
 */
router.get("/:name/regional-names", ingredientController.getRegionalNames);

/**
 * GET /api/ingredients/:name/details
 * Get complete ingredient details (glossary view)
 *
 * Returns:
 * - Name, images, description
 * - Regional names
 * - Category, where to buy, cooking tips
 * - Storage instructions
 * - Health/nutritional info (calories, protein, allergens)
 * - Substitutes with full details
 * - Accessibility descriptions
 *
 * Use case:
 * Ingredient glossary detailed view when user clicks ingredient card
 */
router.get("/:name/details", ingredientController.getIngredientDetails);

/**
 * GET /api/ingredients/:id
 * Get single ingredient by MongoDB ObjectId
 *
 * Must be last route because :id catches everything
 * Use case: API calls from frontend after getting ID from elsewhere
 */
router.get("/:id", ingredientController.getIngredient);

// ========== EXPORT ROUTER ==========
module.exports = router;
