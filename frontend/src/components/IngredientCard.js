/**
 * INGREDIENT CARD - Education Component
 *
 * Purpose:
 * Display individual ingredient with:
 * - Why this ingredient is used (functionType)
 * - What it does in THIS recipe
 * - Hover tooltip with full explanation
 * - Link to ingredient glossary
 * - Substitution option
 *
 * Usage:
 * <IngredientCard
 *   ingredient={{
 *     name: "Cream",
 *     quantity: 200,
 *     unit: "ml",
 *     functionType: "Fat",
 *     explanation: "Emulsifies with pasta water to create smooth sauce coating pasta evenly"
 *   }}
 *   onSubstituteClick={() => handleSubstitute()}
 * />
 */

import React, { useState } from "react";
import "./IngredientCard.css";

/**
 * FUNCTION TYPE ICON MAP
 * Shows user what role this ingredient plays
 */
const FUNCTION_ICONS = {
  Base: "🥄", // Foundation (flour, rice, pasta)
  Protein: "🥚", // Protein (eggs, meat, tofu)
  Fat: "🧈", // Richness (butter, oil, cream)
  Binder: "🔗", // Holds together (egg white, yogurt)
  Thickener: "⬆️", // Texture (cornstarch, flour)
  Flavoring: "🌶️", // Taste (salt, spices, herbs)
  Liquid: "💧", // Moisture (water, milk, broth)
  Acid: "🍋", // Brightness (lemon, vinegar)
  Sweetener: "🍯", // Sugar (honey, sugar)
  Texture: "🥜", // Crunch (nuts, breadcrumbs)
};

/**
 * FUNCTION TYPE EXPLANATIONS
 * What each type does in cooking
 */
const FUNCTION_DESCRIPTIONS = {
  Base: "Foundation of the dish - provides structure and body",
  Protein: "Builds muscle and provides satiety - main nutritional component",
  Fat: "Adds richness and helps carry flavors - essential for taste",
  Binder: "Holds ingredients together - creates cohesive texture",
  Thickener: "Creates sauce consistency - thickens liquids",
  Flavoring: "Adds taste and aroma - seasoning and depth",
  Liquid: "Adds moisture and helps cook ingredients - moisture base",
  Acid: "Brightens flavors and balances richness - adds freshness",
  Sweetener: "Adds sweetness and caramels when cooked - flavor balance",
  Texture: "Adds crunch and contrast - textural element",
};

/**
 * MAIN COMPONENT
 */
const IngredientCard = ({
  ingredient,
  onSubstituteClick,
  recipeTitle = "",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!ingredient) return null;

  const functionType = ingredient.functionType || "Flavoring";
  const functionIcon = FUNCTION_ICONS[functionType] || "✨";
  const functionDesc = FUNCTION_DESCRIPTIONS[functionType] || "";

  /**
   * RENDER
   */
  return (
    <div
      className="ingredient-card"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* MAIN CARD */}
      <div className="ingredient-card-header">
        {/* FUNCTION ICON + NAME */}
        <div className="ingredient-info">
          <span className="function-icon" title={functionType}>
            {functionIcon}
          </span>
          <div className="ingredient-details">
            <h4 className="ingredient-name">{ingredient.name}</h4>
            <p className="ingredient-quantity">
              {ingredient.quantity} {ingredient.unit}
            </p>
          </div>
        </div>

        {/* FUNCTION BADGE */}
        <span className={`function-badge ${functionType.toLowerCase()}`}>
          {functionType}
        </span>
      </div>

      {/* TOOLTIP - EXPLANATION */}
      {showTooltip && (
        <div className="ingredient-tooltip">
          {/* WHAT IT DOES */}
          <div className="tooltip-section">
            <h5>Why this ingredient?</h5>
            <p className="tooltip-text">
              {ingredient.explanation || `${functionIcon} ${functionDesc}`}
            </p>
          </div>

          {/* ROLE IN THIS RECIPE */}
          {recipeTitle && (
            <div className="tooltip-section">
              <h5>In {recipeTitle}:</h5>
              <p className="tooltip-text">
                This {functionType.toLowerCase()} ingredient ensures the dish
                has the right{" "}
                {functionType === "Fat"
                  ? "richness and texture"
                  : functionType === "Binder"
                    ? "structure and consistency"
                    : "flavor profile"}
                .
              </p>
            </div>
          )}

          {/* ACTIONS */}
          <div className="tooltip-actions">
            {onSubstituteClick && (
              <button className="btn-tooltip" onClick={onSubstituteClick}>
                💡 Use something else?
              </button>
            )}
            <a href={`/ingredients/${ingredient._id}`} className="btn-glossary">
              📖 Learn more
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientCard;
