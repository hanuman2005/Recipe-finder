/**
 * VALIDATION SETUP GUIDE
 * ========================
 *
 * This document explains how to use Zod validation schemas
 * throughout the Recipe-Finder backend.
 */

// ========================
// 1. BASIC USAGE
// ========================

/**
 * Example: Using Zod validation in a POST route
 *
 * File: routes/recipeRoutes.js
 */

const { Router } = require("express");
const { validate } = require("../middleware/validationMiddleware");
const {
  createRecipeSchema,
  updateRecipeSchema,
} = require("../validations/recipeValidation");
const recipeController = require("../controllers/recipeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// ✅ CREATE recipe with validation
router.post(
  "/",
  authMiddleware,
  validate(createRecipeSchema),
  recipeController.create,
);

// ✅ UPDATE recipe with validation
router.patch(
  "/:id",
  authMiddleware,
  validate(updateRecipeSchema),
  recipeController.update,
);

module.exports = router;

// ========================
// 2. USER VALIDATION EXAMPLE
// ========================

/**
 * File: routes/authRoutes.js
 */

const { validate } = require("../middleware/validationMiddleware");
const {
  userRegisterValidation,
  userLoginSchema,
  changePasswordValidation,
} = require("../validations/userValidation");

// ✅ REGISTER
router.post(
  "/register",
  validate(userRegisterValidation),
  authController.register,
);

// ✅ LOGIN
router.post("/login", validate(userLoginSchema), authController.login);

// ✅ CHANGE PASSWORD
router.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordValidation),
  authController.changePassword,
);

// ========================
// 3. QUERY VALIDATION EXAMPLE
// ========================

/**
 * File: routes/recipeRoutes.js
 */

const { validateQuery } = require("../middleware/validationMiddleware");
const { recipeFilterSchema } = require("../validations/recipeValidation");

// ✅ GET recipes with query validation
router.get(
  "/",
  validateQuery(recipeFilterSchema),
  recipeController.getAllRecipes,
);

// Now req.query is validated and typed:
// req.query.category = "Breakfast"
// req.query.maxPrepTime = 30
// req.query.equipment = ["Induction", "Stovetop"]

// ========================
// 4. ERROR HANDLING
// ========================

/**
 * When validation fails, the middleware returns a 400 error with:
 *
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "statusCode": 400,
 *   "details": [
 *     {
 *       "field": "title",
 *       "message": "Title must be at least 3 characters"
 *     },
 *     {
 *       "field": "ingredients[0].quantity",
 *       "message": "Quantity must be greater than 0"
 *     }
 *   ]
 * }
 */

// ========================
// 5. COMPLEX NESTED VALIDATION
// ========================

/**
 * The ingredient schema validates nested objects:
 *
 * POST /api/recipes
 * {
 *   "title": "Creamy Pasta",
 *   "ingredients": [
 *     {
 *       "name": "Heavy Cream",
 *       "quantity": 200,
 *       "unit": "ml",
 *       "functionType": "Base",
 *       "substitutes": [
 *         {
 *           "name": "Milk + Butter",
 *           "ratio": "1:1",
 *           "explanation": "Mix equal parts milk and butter"
 *         }
 *       ]
 *     }
 *   ],
 *   "steps": [
 *     {
 *       "stepNumber": 1,
 *       "description": "Heat cream to boiling point",
 *       "duration": 5,
 *       "proTip": "Don't let it split - stir constantly",
 *       "equipment": ["Saucepan", "Thermometer"]
 *     }
 *   ]
 * }
 */

// ========================
// 6. DATABASE SEEDING WITH VALIDATION
// ========================

/**
 * File: seed.js
 *
 * You can validate seed data before inserting:
 */

const { createRecipeSchema } = require("./validations/recipeValidation");

const seedRecipes = async () => {
  const rawRecipes = [
    {
      title: "Hyderabadi Biryani",
      description: "Fragrant rice dish cooked with sheep meat spices",
      image: "https://...",
      category: "Lunch",
      state: "Telangana",
      prepTime: 30,
      cookTime: 45,
      servings: 4,
      difficulty: "Hard",
      equipment: ["Stovetop", "Rice Cooker"],
      ingredients: [
        {
          name: "Basmati Rice",
          quantity: 500,
          unit: "g",
          functionType: "Base",
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: "Soak rice for 20 minutes",
          duration: 20,
          proTip: "Cold water soaking helps prevent sticking",
        },
      ],
    },
  ];

  for (const recipe of rawRecipes) {
    try {
      // Validate before saving
      const validRecipe = await createRecipeSchema.parseAsync(recipe);
      await Recipe.create({ ...validRecipe, user: userId });
    } catch (error) {
      console.error(`Validation failed for ${recipe.title}:`, error);
    }
  }
};

// ========================
// 7. AVAILABLE SCHEMAS & WHEN TO USE
// ========================

/**
 * USER VALIDATION:
 * - userRegisterValidation: Create new account
 * - userLoginSchema: Login
 * - userUpdateSchema: Update profile
 * - changePasswordValidation: Change password
 *
 * RECIPE VALIDATION:
 * - createRecipeSchema: Create new recipe (full validation)
 * - updateRecipeSchema: Update recipe (partial, all fields optional)
 * - recipeFilterSchema: Query parameters for filtering
 * - ingredientSchema: Validate single ingredient
 * - stepSchema: Validate single step
 * - equipmentSchema: Validate equipment array
 *
 * COMMENT VALIDATION:
 * - createCommentSchema: Create new comment
 * - updateCommentSchema: Update comment
 * - commentQuerySchema: Query parameters for comments
 */

// ========================
// 8. ENVIRONMENT SETUP
// ========================

/**
 * Add to .env file:
 *
 * # Validation
 * VALIDATION_ENABLED=true
 * MAX_RECIPE_TITLE_LENGTH=100
 *
 * # Claude API (Power Feature #1)
 * CLAUDE_API_KEY=sk-ant-xxx...
 */

module.exports = {
  setupGuide: "See comments above for detailed usage examples",
};
