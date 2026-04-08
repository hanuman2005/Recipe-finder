/**
 * SUBSTITUTION ROUTES - Express Routes (Feature #5)
 *
 * Public endpoints for ingredient substitution:
 * GET /substitutes - List all available substitutions
 * GET /substitutes/:ingredient - Get substitutes for specific ingredient
 * POST /substitutes/recipe - Get substitutes for multiple ingredients
 */

const express = require("express");
const substitutionController = require("../controllers/substitutionController");

const router = express.Router();

// GET /substitutes - List all available for substitution
router.get("/", substitutionController.getAllSubstitutions);

// GET /substitutes/:ingredient - Get substitutes for ingredient
router.get("/:ingredient", substitutionController.getSubstitutes);

// POST /substitutes/recipe - Get substitutes for recipe (multiple ingredients)
router.post("/recipe", substitutionController.getSubstitutesForRecipe);

module.exports = router;
