/**
 * SUBSTITUTION MODAL - Frontend Component (Feature #1)
 *
 * Purpose:
 * React component that displays when user is missing ingredient in a recipe
 * - Shows Claude AI-suggested substitutes
 * - User can select which substitute to use
 * - Shows detailed cooking instructions for chosen substitute
 * - Integration with recipe card or recipe details page
 *
 * Example Usage:
 * <SubstitutionModal
 *   ingredient="cream"
 *   recipe="Alfredo Pasta"
 *   onClose={() => setShowModal(false)}
 *   onSelect={(substitute) => updateRecipe(substitute)}
 * />
 */

import React, { useState, useEffect } from "react";
import "./SubstitutionModal.css"; // Specific styling for this modal

/**
 * MAIN COMPONENT
 */
const SubstitutionModal = ({
  ingredient,
  recipe = "Unknown Recipe",
  onClose,
  onSelect,
  userDiet = null, // User's diet preference: "vegan", "keto", etc.
}) => {
  // State Management
  const [substitutes, setSubstitutes] = useState([]); // List of suggested substitutes
  const [loading, setLoading] = useState(false); // API call in progress
  const [error, setError] = useState(null); // Error message if API fails
  const [selectedSubstitute, setSelectedSubstitute] = useState(null); // Currently selected substitute
  const [showDetails, setShowDetails] = useState(false); // Show detailed cooking instructions
  const [details, setDetails] = useState(null); // Cached explanation/instructions

  /**
   * FETCH SUBSTITUTES ON MOUNT
   *
   * When modal opens, immediately call API to get Claude suggestions
   * for the missing ingredient
   */
  useEffect(() => {
    fetchSubstitutes();
  }, [ingredient]);

  /**
   * FETCH SUBSTITUTES FROM BACKEND
   *
   * API Call: GET /api/substitutions?ingredient=cream&recipe=pasta
   * Response includes array of substitutes with ratios and explanations
   */
  const fetchSubstitutes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        ingredient: ingredient,
        recipe: recipe,
      });

      // Determine endpoint based on user diet preference
      const endpoint = userDiet
        ? `/api/substitutions/diet?ingredient=${ingredient}&diet=${userDiet}&recipe=${recipe}`
        : `/api/substitutions?${params}`;

      // Call backend API
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch substitutes: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract substitutes from response
      const substitutesData = userDiet
        ? data.data.substitutes
        : data.data.substitutes;

      setSubstitutes(substitutesData);
    } catch (err) {
      console.error("❌ Error fetching substitutes:", err);
      setError(err.message || "Failed to fetch substitutes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH DETAILED EXPLANATION FOR SUBSTITUTE
   *
   * When user clicks "Learn more" or hovers over a substitute,
   * fetch detailed cooking instructions
   */
  const fetchDetails = async (substitute) => {
    try {
      const response = await fetch(
        `/api/substitutions/explain?original=${ingredient}&substitute=${substitute.name}&recipe=${recipe}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch details");

      const data = await response.json();
      setDetails(data.data);
      setShowDetails(true);
    } catch (err) {
      console.error("❌ Error fetching details:", err);
      setError("Failed to load detailed instructions.");
    }
  };

  /**
   * VALIDATE SUBSTITUTION
   *
   * Before user confirms, check if this substitute would actually work
   * Shows feasibility rating and any warnings
   */
  const validateSubstitution = async (substitute) => {
    try {
      const response = await fetch(`/api/substitutions/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original: ingredient,
          substitute: substitute.name,
          recipe: recipe,
        }),
      });

      if (!response.ok) throw new Error("Validation failed");

      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error("❌ Validation error:", err);
      return null;
    }
  };

  /**
   * HANDLE SUBSTITUTE SELECTION
   *
   * When user clicks "Use This" on a substitute:
   * 1. Validate feasibility
   * 2. Call parent's onSelect callback
   * 3. Close modal
   */
  const handleSelectSubstitute = async (substitute) => {
    // Validate first
    const validation = await validateSubstitution(substitute);

    if (validation && !validation.feasible && validation.rating < 2) {
      // Show warning for bad substitutions
      if (
        !window.confirm(
          `Warning: ${validation.explanation}\n\nStill use this substitute?`,
        )
      ) {
        return;
      }
    }

    // Call parent callback
    onSelect({
      original: ingredient,
      substitute: substitute.name,
      ratio: substitute.ratio,
      explanation: substitute.explanation,
      validation: validation,
    });

    // Close modal
    onClose();
  };

  /**
   * RENDER LOADING STATE
   */
  if (loading) {
    return (
      <div className="substitution-modal">
        <div className="modal-overlay" onClick={onClose} />
        <div className="modal-content">
          <div className="modal-header">
            <h2>Finding substitutes for {ingredient}...</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="loading">
            <div className="spinner" />
            <p>✨ Claude AI is analyzing your recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * RENDER ERROR STATE
   */
  if (error) {
    return (
      <div className="substitution-modal">
        <div className="modal-overlay" onClick={onClose} />
        <div className="modal-content">
          <div className="modal-header">
            <h2>Oops! Something went wrong</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchSubstitutes} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * RENDER MAIN CONTENT - LIST OF SUBSTITUTES
   */
  return (
    <div className="substitution-modal">
      {/* Overlay - click to close */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Modal Content */}
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Substitutes for {ingredient}</h2>
            <p className="recipe-name">Recipe: {recipe}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Substitutes List */}
        <div className="substitutes-list">
          {substitutes && substitutes.length > 0 ? (
            substitutes.map((substitute, index) => (
              <div key={index} className="substitute-card">
                {/* Substitute Name */}
                <div className="substitute-header">
                  <h3>{substitute.name}</h3>
                  <span className="category-badge">{substitute.category}</span>
                </div>

                {/* Ratio */}
                <div className="substitute-info">
                  <span className="label">Ratio:</span>
                  <span className="value">{substitute.ratio}</span>
                </div>

                {/* Explanation */}
                <p className="substitute-explanation">
                  {substitute.explanation}
                </p>

                {/* Actions */}
                <div className="substitute-actions">
                  <button
                    className="learn-more-btn"
                    onClick={() => {
                      setSelectedSubstitute(substitute);
                      fetchDetails(substitute);
                    }}
                  >
                    📖 Learn More
                  </button>
                  <button
                    className="use-btn"
                    onClick={() => handleSelectSubstitute(substitute)}
                  >
                    ✓ Use This
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-substitutes">
              <p>No substitutes found. Try a different ingredient.</p>
            </div>
          )}
        </div>

        {/* Details Panel - Shows when "Learn More" is clicked */}
        {showDetails && details && (
          <div className="details-panel">
            <button
              className="close-details"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>
            <h4>Cooking Instructions</h4>
            <p>{details.instructions}</p>
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <p className="footer-text">
            💡 Powered by Claude AI - Get smart ingredient substitutions
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionModal;
