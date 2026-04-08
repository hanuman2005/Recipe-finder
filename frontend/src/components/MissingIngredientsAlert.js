/**
 * MISSING INGREDIENTS ALERT - Component for Recipe Details Page
 *
 * Purpose:
 * Shows on recipe details page when user is missing ingredients
 * - Lists all missing ingredients
 * - "Get Substitutes" button opens SubstitutionModal
 * - Integration with user's pantry (leftovers, available ingredients)
 *
 * Example Usage:
 * <MissingIngredientsAlert
 *   missingIngredients={["cream", "paneer", "ghee"]}
 *   recipeName="Butter Chicken"
 *   onSubstitute={(substitute) => updateRecipe(substitute)}
 * />
 */

import React, { useState } from "react";
import SubstitutionModal from "./SubstitutionModal";
import "./MissingIngredientsAlert.css";

/**
 * MAIN COMPONENT
 */
const MissingIngredientsAlert = ({
  missingIngredients = [],
  availableIngredients = [],
  recipeName = "Recipe",
  onSubstitute,
  userDiet = null, // User's diet preference
}) => {
  // State Management
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [substitutions, setSubstitutions] = useState({}); // Track which ingredients were substituted

  /**
   * HANDLE INGREDIENT CLICK
   *
   * When user clicks on a missing ingredient,
   * open substitution modal for that ingredient
   */
  const handleGetSubstitutes = (ingredient) => {
    setSelectedIngredient(ingredient);
    setShowSubstitutionModal(true);
  };

  /**
   * HANDLE SUBSTITUTION SELECTION
   *
   * When user selects a substitute from the modal,
   * store it and update parent component
   */
  const handleSubstituteSelected = (substitution) => {
    const ingredientName = selectedIngredient;

    // Store substitution
    setSubstitutions({
      ...substitutions,
      [ingredientName]: substitution,
    });

    // Call parent callback
    if (onSubstitute) {
      onSubstitute(substitution);
    }

    // Close modal
    setShowSubstitutionModal(false);
  };

  /**
   * CALCULATE COVERAGE
   *
   * How many ingredients user has already vs missing
   */
  const totalIngredients =
    missingIngredients.length + availableIngredients.length;
  const coverage =
    totalIngredients > 0
      ? Math.round((availableIngredients.length / totalIngredients) * 100)
      : 0;

  // Don't show if no missing ingredients
  if (missingIngredients.length === 0) {
    return null;
  }

  return (
    <>
      {/* ALERT BANNER */}
      <div className="missing-ingredients-alert">
        <div className="alert-header">
          <div className="alert-title">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">
              {missingIngredients.length} ingredient
              {missingIngredients.length !== 1 ? "s" : ""} missing
            </span>
          </div>
          <div className="coverage-badge">{coverage}% ready</div>
        </div>

        {/* PROGRESS BAR */}
        <div className="coverage-progress">
          <div className="coverage-bar" style={{ width: `${coverage}%` }} />
        </div>

        {/* MISSING INGREDIENTS LIST */}
        <div className="missing-ingredients-list">
          <p className="list-label">You're missing:</p>
          <div className="ingredients-grid">
            {missingIngredients.map((ingredient, index) => (
              <div key={index} className="missing-ingredient-item">
                {/* Ingredient tag */}
                <span className="ingredient-name">{ingredient}</span>

                {/* Check if already substituted */}
                {substitutions[ingredient] ? (
                  <div className="substituted-badge">
                    <span className="checkmark">✓</span>
                    <span className="substitute-name">
                      {substitutions[ingredient].substitute}
                    </span>
                  </div>
                ) : (
                  /* "Get Substitutes" button */
                  <button
                    className="substitute-btn"
                    onClick={() => handleGetSubstitutes(ingredient)}
                  >
                    🔄 Get Alternatives
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AVAILABLE INGREDIENTS INFO */}
        {availableIngredients.length > 0 && (
          <div className="available-ingredients-info">
            <p className="info-label">You have:</p>
            <div className="tags">
              {availableIngredients.map((ingredient, index) => (
                <span key={index} className="available-tag">
                  ✓ {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* BATCH SUBSTITUTIONS OPTION */}
        <div className="batch-action">
          <button className="batch-btn">
            🚀 Find Alternatives for All Missing
          </button>
          <p className="batch-note">
            Get substitutes for all missing ingredients at once using AI
          </p>
        </div>
      </div>

      {/* SUBSTITUTION MODAL */}
      {showSubstitutionModal && selectedIngredient && (
        <SubstitutionModal
          ingredient={selectedIngredient}
          recipe={recipeName}
          onClose={() => setShowSubstitutionModal(false)}
          onSelect={handleSubstituteSelected}
          userDiet={userDiet}
        />
      )}
    </>
  );
};

export default MissingIngredientsAlert;
