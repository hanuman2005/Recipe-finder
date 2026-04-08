/**
 * LEFTOVER SUGGESTIONS - React Component (Feature #2)
 *
 * Purpose:
 * Display recipe suggestions for a specific leftover ingredient
 * Shows after 12 hours have passed since leftover was saved
 * Also accessible from LeftoverPantry "Recipes" button
 *
 * Features:
 * - Recipe cards with ratings
 * - Prep times, difficulty levels
 * - "Cook with Leftover" button
 * - Tracks which recipes user cooked
 *
 * Usage:
 * <LeftoverSuggestions leftover={leftoverData} />
 */

import React, { useState, useEffect } from "react";
import "./LeftoverSuggestions.css";

/**
 * LEFTOVER SUGGESTIONS COMPONENT
 */
const LeftoverSuggestions = ({ leftoverId, onRecipeSelect }) => {
  // State Management
  const [suggestions, setSuggestions] = useState([]); // Recipe suggestions
  const [leftover, setLeftover] = useState(null); // Leftover details
  const [loading, setLoading] = useState(true); // API call in progress
  const [error, setError] = useState(null); // Error message
  const [sortBy, setSortBy] = useState("rating"); // Sort option

  /**
   * FETCH SUGGESTIONS ON MOUNT
   */
  useEffect(() => {
    fetchSuggestions();
  }, [leftoverId]);

  /**
   * FETCH RECIPE SUGGESTIONS FROM BACKEND
   *
   * API Call: GET /api/leftovers/:leftoverId/suggestions?sort=rating&limit=5
   */
  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/leftovers/${leftoverId}/suggestions?sort=${sortBy}&limit=5`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      setSuggestions(data.data.suggestions);
      setLeftover(data.data.leftover);
    } catch (err) {
      console.error("❌ Error fetching suggestions:", err);
      setError(err.message || "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  /**
   * HANDLE RECIPE SELECTION
   *
   * When user clicks "Cook with This"
   */
  const handleRecipeSelect = (recipe) => {
    if (onRecipeSelect) {
      onRecipeSelect(recipe, leftover);
    }
  };

  /**
   * STAR RATING DISPLAY
   */
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span
          key={i}
          className={i < Math.round(rating) ? "star filled" : "star"}
        >
          ★
        </span>,
      );
    }
    return stars;
  };

  /**
   * RENDER LOADING STATE
   */
  if (loading) {
    return (
      <div className="leftover-suggestions">
        <div className="loading">
          <div className="spinner" />
          <p>Finding recipes for you...</p>
        </div>
      </div>
    );
  }

  /**
   * RENDER ERROR STATE
   */
  if (error) {
    return (
      <div className="leftover-suggestions">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchSuggestions} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /**
   * RENDER EMPTY STATE
   */
  if (suggestions.length === 0) {
    return (
      <div className="leftover-suggestions">
        <div className="empty-state">
          <p>No recipes found using this ingredient.</p>
          <p className="empty-hint">Try searching for recipes manually.</p>
        </div>
      </div>
    );
  }

  /**
   * RENDER MAIN SUGGESTIONS
   */
  return (
    <div className="leftover-suggestions">
      {/* HEADER */}
      <div className="suggestions-header">
        <div>
          <h2>🍳 Recipe Suggestions</h2>
          <p className="leftover-info">
            Using:{" "}
            <strong>
              {leftover.quantity} {leftover.unit} {leftover.ingredientName}
            </strong>
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="rating">Sorted by Rating</option>
          <option value="prepTime">Sorted by Time</option>
          <option value="difficulty">Sorted by Difficulty</option>
        </select>
      </div>

      {/* SUGGESTIONS LIST */}
      <div className="suggestions-list">
        {suggestions.map((recipe, index) => (
          <div key={recipe._id || index} className="recipe-card">
            {/* RANK BADGE */}
            <div className="rank-badge">#{index + 1}</div>

            {/* RECIPE IMAGE */}
            {recipe.image && (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="recipe-image"
              />
            )}

            <div className="recipe-content">
              {/* TITLE */}
              <h3 className="recipe-title">{recipe.title}</h3>

              {/* RATING */}
              <div className="recipe-rating">
                <div className="stars">{renderStars(recipe.rating || 0)}</div>
                <span className="rating-value">
                  {recipe.rating?.toFixed(1) || "N/A"}
                </span>
                <span className="reviews">({recipe.reviews || 0})</span>
              </div>

              {/* QUICK INFO */}
              <div className="recipe-info">
                <div className="info-item">
                  <span className="icon">⏱️</span>
                  <span>{recipe.prepTime || "?"} min</span>
                </div>
                <div className="info-item">
                  <span className="icon">📊</span>
                  <span>{recipe.difficulty || "Medium"}</span>
                </div>
                <div className="info-item">
                  <span className="icon">👥</span>
                  <span>{recipe.servings || 4} servings</span>
                </div>
              </div>

              {/* DESCRIPTION */}
              {recipe.description && (
                <p className="recipe-description">{recipe.description}</p>
              )}

              {/* KEY INGREDIENTS */}
              {recipe.keyIngredients && recipe.keyIngredients.length > 0 && (
                <div className="key-ingredients">
                  <p className="label">Main ingredients:</p>
                  <div className="ingredients-pills">
                    {recipe.keyIngredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className={
                          ing.toLowerCase() ===
                          leftover.ingredientName.toLowerCase()
                            ? "pill highlighted"
                            : "pill"
                        }
                      >
                        {ing === leftover.ingredientName ? `✓ ${ing}` : ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="recipe-actions">
                <button
                  className="use-leftover-btn"
                  onClick={() => handleRecipeSelect(recipe)}
                >
                  🍳 Cook with Leftover
                </button>
                <button className="view-recipe-btn">View Recipe →</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="suggestions-footer">
        <p className="footer-note">
          💡 These recipes use your leftover {leftover.ingredientName}. Click
          "Cook with Leftover" to use it up!
        </p>
      </div>
    </div>
  );
};

export default LeftoverSuggestions;
