/**
 * COOK COMPLETE MODAL - React Component (Feature #2 UX Enhancement)
 *
 * Purpose:
 * Modal that appears after user marks a recipe as "cooked" to:
 * 1. Congratulate them
 * 2. Show ingredients used
 * 3. Prompt to save leftovers (if any)
 * 4. Save to leftover pantry if confirmed
 *
 * Usage:
 * <CookCompleteModal
 *   isOpen={true}
 *   recipe={recipe}
 *   onClose={handleClose}
 *   onSaveLeftovers={handleSave}
 * />
 */

import React, { useState } from "react";
import "./CookCompleteModal.css";

/**
 * MAIN COMPONENT
 */
const CookCompleteModal = ({ isOpen, recipe, onClose, onSaveLeftovers }) => {
  // State
  const [selectedLeftovers, setSelectedLeftovers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !recipe) return null;

  /**
   * TOGGLE INGREDIENT SELECTION
   */
  const toggleIngredient = (ingredientId) => {
    setSelectedLeftovers((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId],
    );
  };

  /**
   * HANDLE SAVE LEFTOVERS
   */
  const handleSave = async () => {
    if (selectedLeftovers.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save each selected leftover
      for (const ingredientId of selectedLeftovers) {
        const ingredient = recipe.ingredients.find(
          (ing) => ing._id === ingredientId,
        );
        if (!ingredient) continue;

        const response = await fetch("/api/leftovers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ingredientId: ingredient.ingredientId,
            ingredientName: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            recipeId: recipe._id,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save ${ingredient.name}`);
        }
      }

      setSuccess(true);
      if (onSaveLeftovers) onSaveLeftovers(selectedLeftovers);

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("❌ Error saving leftovers:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * RENDER
   */
  return (
    <div className="cook-modal-overlay">
      <div className="cook-complete-modal">
        {/* SUCCESS STATE */}
        {success && (
          <div className="success-content">
            <div className="confetti-emoji">🎉</div>
            <h2>Awesome!</h2>
            <p>
              {selectedLeftovers.length} ingredient
              {selectedLeftovers.length !== 1 ? "s" : ""} saved to your pantry!
            </p>
            <p className="subtitle">
              You'll get a notification in 12 hours to cook them.
            </p>
          </div>
        )}

        {/* NORMAL STATE */}
        {!success && (
          <>
            {/* HEADER */}
            <div className="modal-header">
              <h2>🍳 Recipe Complete!</h2>
              <button className="close-btn" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* CONTENT */}
            <div className="modal-content">
              <p className="congratulations">
                Great job cooking "{recipe.title}"! 👨‍🍳
              </p>

              {/* INGREDIENTS LIST */}
              <div className="ingredients-section">
                <h3>📦 Any Leftovers?</h3>
                <p className="section-subtitle">
                  Select ingredients you have left to save them. We'll suggest
                  recipes in 12 hours.
                </p>

                <div className="ingredients-list">
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    recipe.ingredients.map((ingredient) => (
                      <label
                        key={ingredient._id}
                        className="ingredient-checkbox"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLeftovers.includes(ingredient._id)}
                          onChange={() => toggleIngredient(ingredient._id)}
                        />
                        <div className="checkbox-content">
                          <span className="ingredient-name">
                            {ingredient.name}
                          </span>
                          <span className="ingredient-quantity">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="no-ingredients">
                      No ingredients listed for this recipe.
                    </p>
                  )}
                </div>
              </div>

              {/* ERROR STATE */}
              {error && (
                <div className="error-alert">
                  <span>❌ {error}</span>
                </div>
              )}

              {/* ACTIONS */}
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Skip
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || selectedLeftovers.length === 0}
                >
                  {saving ? (
                    <>
                      <span className="spinner-mini" /> Saving...
                    </>
                  ) : (
                    `💾 Save ${selectedLeftovers.length > 0 ? selectedLeftovers.length : ""} Leftover${selectedLeftovers.length !== 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookCompleteModal;
