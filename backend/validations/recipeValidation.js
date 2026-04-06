// ========== RECIPE VALIDATION SCHEMAS ==========
// Defines all Zod validation schemas for recipe-related API endpoints
// Supports POWER FEATURE #1 (ingredient substitutes), #3 (equipment filter), #4 (pro tips)
// Handles nested array validation for complex recipe structures

// Import Zod library for type-safe validation with nested object support
const { z } = require("zod");

// ========== INGREDIENT SCHEMA (with Power Feature #1 Support) ==========
/**
 * Ingredient validation schema (nested within recipe)
 * Each recipe contains multiple ingredients
 * Supports ingredient substitutes (Power Feature #1)
 *
 * Fields validated:
 *   - name: String, minimum 1 char, trimmed
 *   - quantity: Positive number (1, 2.5, etc)
 *   - unit: Enum of 8 measurement units (g, ml, cup, tbsp, tsp, piece, whole, pinch)
 *   - functionType: Category of ingredient's role (optional, defaults to "Base")
 *   - substitutes: Array of substitute objects with name/ratio/explanation (optional)
 *
 * POWER FEATURE #1 INTEGRATION:
 *   {
 *     name: "Butter",
 *     substitutes: [
 *       { name: "Coconut oil", ratio: "1:1", explanation: "Similar fat content and cooking properties" }
 *     ]
 *   }
 */
const ingredientSchema = z.object({
  // Ingredient name/item (e.g., "Chicken Breast", "Soy Sauce")
  name: z.string().min(1, "Ingredient name is required").trim(),

  // Amount of ingredient needed (must be positive number)
  quantity: z.number().positive("Quantity must be greater than 0"),

  // Unit of measurement - enum restricts to valid culinary units
  // .enum() with errorMap provides custom error message
  unit: z.enum(["g", "ml", "cup", "tbsp", "tsp", "piece", "whole", "pinch"], {
    errorMap: () => ({ message: "Invalid unit of measurement" }),
  }),

  // POWER FEATURE #1: Ingredient function classification (optional)
  // Helps categorize ingredients by their role in recipe chemistry
  functionType: z
    .enum([
      "Base", // Main ingredient (e.g., chicken, rice)
      "Protein", // Protein source (e.g., egg, tofu)
      "Vegetable", // Vegetable component
      "Thickener", // Makes sauce thicker (e.g., cornstarch)
      "Binder", // Holds ingredients together (e.g., egg binder)
      "Seasoning", // Flavor enhancer (e.g., salt, pepper)
      "Acid", // Adds acidity (e.g., lemon juice, vinegar)
      "Fat", // Cooking fat (e.g., oil, butter)
      "Leavening", // Makes food rise (e.g., baking powder)
      "Flavoring", // Adds flavor (e.g., vanilla, soy sauce)
    ])
    .optional()
    .default("Base"), // Default if not specified

  // POWER FEATURE #1: Array of substitute ingredients
  // Allows users to see alternative ingredients and ratios
  substitutes: z
    .array(
      z.object({
        name: z.string().trim(), // Substitute ingredient name
        ratio: z.string().trim(), // How much to use (e.g., "1:1", "1:0.8")
        explanation: z.string().trim(), // Why this substitution works
      }),
    )
    .optional(),
});

// ========== STEP SCHEMA (with Power Feature #4 Support) ==========
/**
 * Cooking step validation schema (nested within recipe)
 * Each recipe contains multiple sequential steps
 * Supports pro tips and timing (Power Feature #4)
 *
 * Fields validated:
 *   - stepNumber: Positive integer indicating step order
 *   - description: String minimum 10 chars, detailed instruction
 *   - duration: Optional time in minutes (must be nonnegative)
 *   - proTip: Optional kitchen tip/hack (Power Feature #4)
 *   - image: Optional step image URL (visual guide)
 *   - equipment: Optional array of equipment needed for this step
 *
 * POWER FEATURE #4 INTEGRATION:
 *   {
 *     stepNumber: 1,
 *     description: "Sauté the onions...",
 *     proTip: "Don't brown the onions too much or they'll become bitter"
 *   }
 */
const stepSchema = z.object({
  // Step order (1, 2, 3, etc)
  stepNumber: z.number().positive("Step number must be positive"),

  // Detailed cooking instructions
  description: z
    .string()
    .min(10, "Step description must be at least 10 characters")
    .trim(),

  // Time required for this step (optional, in minutes)
  duration: z.number().nonnegative("Duration cannot be negative").optional(),

  // POWER FEATURE #4: Pro tip/kitchen hack for this step (optional)
  // Helps users cook more effectively
  proTip: z.string().trim().optional(),

  // Optional step image (visual guide showing what the result should look like)
  image: z.string().url("Invalid image URL").optional(),

  // Equipment needed specifically for this step (e.g., "Blender", "Whisk")
  equipment: z.array(z.string().trim()).optional(),
});

// ========== EQUIPMENT SCHEMA (Power Feature #3) ==========
/**
 * POWER FEATURE #3: Equipment filter validation
 * Array of enum values representing cooking equipment/methods
 * Used in two contexts:
 *   1. Recipe-level equipment (what major equipment does this recipe need?)
 *   2. Search filter (filter recipes by available equipment)
 *
 * Enum values represent common cooking methods/equipment:
 *   - Stovetop: Gas/electric range
 *   - Oven: Conventional oven
 *   - Microwave: Quick cooking method
 *   - Induction: Electric cooktop
 *   - Rice Cooker: Specialized appliance
 *   - Pressure Cooker: High-pressure cooking
 *   - Air Fryer: Hot air circulation
 *   - Blender: Food processor
 *   - Food Processor: Chopping/mixing
 *   - One-Pot: Minimalist cooking (single vessel)
 *   - No-Cook: No heat required (salads, sandwiches)
 *
 * Example usage in recipe:
 *   equipment: ["Stovetop", "Oven"]
 */
const equipmentSchema = z.array(
  z.enum([
    "Stovetop",
    "Oven",
    "Microwave",
    "Induction",
    "Rice Cooker",
    "Pressure Cooker",
    "Air Fryer",
    "Blender",
    "Food Processor",
    "One-Pot",
    "No-Cook",
  ]),
  { errorMap: () => ({ message: "Invalid equipment type" }) },
);

// ========== CREATE RECIPE VALIDATION ==========
/**
 * Schema for creating new recipes (POST /api/recipes)
 * Validates all recipe data with nested ingredient/step validation
 *
 * Major sections:
 *   - Basic info: title, description, category, region/state
 *   - Media: image URL
 *   - Timing: prepTime, cookTime, servings
 *   - Content: ingredients array, steps array
 *   - Features: benefits (health aspects), difficulty, equipment
 *   - Status: isPublished (visible to others)
 *
 * Nested arrays:
 *   - ingredients: Array of ingredientSchema (min 1 required)
 *   - steps: Array of stepSchema (min 1 required)
 *   - equipment: Array from equipmentSchema (optional)
 */
const createRecipeSchema = z.object({
  // Recipe name (3-100 chars)
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),

  // Long-form description of recipe
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .trim(),

  // Cover image URL (must be valid URL)
  image: z.string().url("Invalid image URL"),

  // Recipe category (enum restricts to valid types)
  category: z.enum(
    ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Beverage", "Starter"],
    { errorMap: () => ({ message: "Invalid category" }) },
  ),

  // Cuisine region/state (Indian regional cuisine: "Tamil Nadu", "Punjab", etc)
  state: z.string().min(1, "Cuisine region (state) is required").trim(),

  // Health benefits of recipe (optional, e.g., "High in protein, Low in sodium")
  benefits: z.string().trim().optional(),

  // Difficulty level (optional, defaults to "Medium")
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional().default("Medium"),

  // Time to prepare ingredients (in minutes, minimum 1)
  prepTime: z.number().min(1, "Prep time must be at least 1 minute"),

  // Time to cook (in minutes, minimum 1)
  cookTime: z.number().min(1, "Cook time must be at least 1 minute"),

  // Number of servings (default 4, minimum 1)
  servings: z.number().min(1, "Must serve at least 1 person").default(4),

  // Array of ingredients (nested validation via ingredientSchema)
  // Minimum 1 ingredient required (recipes must have ingredients)
  ingredients: z
    .array(ingredientSchema)
    .min(1, "At least one ingredient is required"),

  // Array of cooking steps (nested validation via stepSchema)
  // Minimum 1 step required (recipes must have instructions)
  steps: z.array(stepSchema).min(1, "At least one step is required"),

  // POWER FEATURE #3: Array of equipment needed
  // Optional because some recipes might not specify key equipment
  equipment: equipmentSchema.optional(),

  // Publish status (visible to others if true, draft if false)
  isPublished: z.boolean().optional().default(true),
});

// ========== UPDATE RECIPE VALIDATION (All fields optional) ==========
/**
 * Schema for updating recipes (PUT /api/recipes/:id)
 * Uses .partial() to make all fields optional
 *
 * .partial() means:
 *   - No fields are required
 *   - Fields that are present still validate against createRecipeSchema rules
 *   - Allows partial updates (update only title, leave others unchanged)
 *   - Controller handles selective field updates via whitelisting
 *
 * Example: Only update title and cooking time
 *   {
 *     title: "New Title",
 *     cookTime: 25
 *   }
 */
const updateRecipeSchema = createRecipeSchema.partial();

// ========== RECIPE FILTER & SEARCH VALIDATION ==========
/**
 * Schema for recipe search and filtering (GET /api/recipes with query params)
 * Validates all query parameters for recipe listing endpoint
 *
 * Filter types:
 *   - Categorical: category, state, difficulty
 *   - POWER FEATURE #3: equipment array filter (user's available equipment)
 *   - Time: maxPrepTime, maxCookTime (maximum time willing to spend)
 *   - Quality: minRating (minimum user rating, 0-5)
 *   - Search: search text (full-text search)
 *   - Sort: sortBy (how to order results)
 *   - Pagination: page, limit
 *
 * All fields optional - user specifies only filters they need
 *
 * Example query:
 *   GET /api/recipes?state=Tamil&difficulty=Easy&equipment=Oven&maxPrepTime=30&page=1
 */
const recipeFilterSchema = z.object({
  // Filter by category (optional)
  category: z.string().optional(),

  // Filter by cuisine region (optional)
  state: z.string().optional(),

  // Filter by difficulty level (optional)
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),

  // POWER FEATURE #3: Filter by available equipment (array of equipment types)
  // User can specify multiple equipment items they own
  // Backend uses $in query with equipment filter
  equipment: z.array(z.string()).optional(),

  // Filter recipes with max prep time (optional, in minutes)
  maxPrepTime: z.number().nonnegative().optional(),

  // Filter recipes with max cook time (optional, in minutes)
  maxCookTime: z.number().nonnegative().optional(),

  // Filter recipes with minimum average rating (0-5 stars)
  minRating: z.number().min(0).max(5).optional(),

  // Free-text search across recipe title, description, benefits (optional)
  search: z.string().trim().optional(),

  // Sort order for results (optional, defaults to "newest")
  // Options: newest (by date), rating (highest rated), prepTime (shortest), cookTime (shortest)
  sortBy: z
    .enum(["newest", "rating", "prepTime", "cookTime"])
    .optional()
    .default("newest"),

  // Pagination: page number (1-indexed, optional, defaults to 1)
  page: z.number().positive().optional().default(1),

  // Pagination: results per page (optional, max 100, defaults to 10)
  limit: z.number().positive().max(100).optional().default(10),
});

// ========== EXPORT VALIDATION SCHEMAS ==========
// Exports all schemas for use in routes via validate/validateQuery middleware
//
// Usage examples:
//   POST /recipes: validate(createRecipeSchema)
//   PUT /recipes/:id: validate(updateRecipeSchema)
//   GET /recipes: validateQuery(recipeFilterSchema)
module.exports = {
  createRecipeSchema, // For POST - create new recipe
  updateRecipeSchema, // For PUT - update existing recipe (.partial() = all optional)
  recipeFilterSchema, // For GET - search and filter recipes
  ingredientSchema, // Exported for reference/composition
  stepSchema, // Exported for reference/composition
  equipmentSchema, // Exported for reference/composition (POWER FEATURE #3)
};
