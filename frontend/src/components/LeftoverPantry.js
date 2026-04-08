/**
 * LEFTOVER PANTRY - React Component (Feature #2)
 *
 * Purpose:
 * Display user's saved leftovers in a pantry view
 * Shows:
 * - Leftover ingredient with image
 * - Quantity, unit, expiration date
 * - Days remaining indicator
 * - Delete button
 * - Link to recipe suggestions
 *
 * Usage:
 * <LeftoverPantry userId={userId} />
 */

import React, { useState, useEffect } from "react";
import "./LeftoverPantry.css";

/**
 * LEFTOVER PANTRY COMPONENT
 */
const LeftoverPantry = ({ userId, onSuggestionClick }) => {
  // State Management
  const [leftovers, setLeftovers] = useState([]); // List of leftovers
  const [loading, setLoading] = useState(true); // API call in progress
  const [error, setError] = useState(null); // Error message
  const [sortBy, setSortBy] = useState("expiry"); // Sort option
  const [filterBy, setFilterBy] = useState("active"); // Filter option

  /**
   * FETCH LEFTOVERS ON MOUNT
   */
  useEffect(() => {
    fetchLeftovers();
  }, [sortBy, filterBy]);

  /**
   * FETCH LEFTOVERS FROM BACKEND
   *
   * API Call: GET /api/leftovers?sort=expiry&filter=active
   */
  const fetchLeftovers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sort: sortBy,
        filter: filterBy,
      });

      const response = await fetch(`/api/leftovers?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leftovers: ${response.statusText}`);
      }

      const data = await response.json();
      setLeftovers(data.data.leftovers);
    } catch (err) {
      console.error("❌ Error fetching leftovers:", err);
      setError(err.message || "Failed to load pantry");
    } finally {
      setLoading(false);
    }
  };

  /**
   * DELETE LEFTOVER
   *
   * Remove from pantry
   */
  const handleDelete = async (leftoverId) => {
    if (!window.confirm("Remove this leftover from your pantry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/leftovers/${leftoverId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete leftover");
      }

      // Remove from state
      setLeftovers(leftovers.filter((l) => l._id !== leftoverId));
    } catch (err) {
      console.error("❌ Error deleting leftover:", err);
      setError("Failed to delete leftover");
    }
  };

  /**
   * CALCULATE DAYS REMAINING
   */
  const getDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  /**
   * GET URGENCY COLOR
   */
  const getUrgencyColor = (expiresAt) => {
    const days = getDaysRemaining(expiresAt);
    if (days <= 0) return "expired";
    if (days === 1) return "urgent";
    if (days <= 1.5) return "expiring";
    return "active";
  };

  /**
   * RENDER LOADING STATE
   */
  if (loading) {
    return (
      <div className="leftover-pantry">
        <div className="loading">
          <div className="spinner" />
          <p>Loading your pantry...</p>
        </div>
      </div>
    );
  }

  /**
   * RENDER EMPTY STATE
   */
  if (!loading && leftovers.length === 0) {
    return (
      <div className="leftover-pantry">
        <div className="pantry-header">
          <h2>🥘 My Pantry</h2>
          <div className="controls">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="expiry">Sort by Expiry</option>
              <option value="recent">Sort by Recent</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-icon">🥗</div>
          <p>Your pantry is empty!</p>
          <p className="empty-hint">
            Cook a recipe and save leftovers to see them here
          </p>
        </div>
      </div>
    );
  }

  /**
   * RENDER MAIN PANTRY
   */
  return (
    <div className="leftover-pantry">
      {/* HEADER */}
      <div className="pantry-header">
        <h2>🥘 My Pantry</h2>
        <div className="controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="expiry">Sort by Expiry</option>
            <option value="recent">Sort by Recent</option>
            <option value="quantity">Sort by Quantity</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && <div className="error-message">{error}</div>}

      {/* LEFTOVERS GRID */}
      <div className="leftovers-grid">
        {leftovers.map((leftover) => {
          const daysRemaining = getDaysRemaining(leftover.expiresAt);
          const urgency = getUrgencyColor(leftover.expiresAt);

          return (
            <div key={leftover._id} className={`leftover-card ${urgency}`}>
              {/* URGENCY BADGE */}
              <div className={`urgency-badge ${urgency}`}>
                {urgency === "expired" && "⏰ Expired"}
                {urgency === "urgent" && "⚠️ Today!"}
                {urgency === "expiring" && "⚠️ Tomorrow"}
                {urgency === "active" && `📅 ${daysRemaining}d`}
              </div>

              {/* INGREDIENT IMAGE */}
              {leftover.image && (
                <img
                  src={leftover.image}
                  alt={leftover.ingredientName}
                  className="leftover-image"
                />
              )}

              <div className="leftover-content">
                {/* INGREDIENT NAME */}
                <h3 className="ingredient-name">{leftover.ingredientName}</h3>

                {/* QUANTITY */}
                <div className="quantity-info">
                  <span className="value">
                    {leftover.quantity} {leftover.unit}
                  </span>
                </div>

                {/* EXPIRATION */}
                <div className="expiration-info">
                  <span className="label">Expires:</span>
                  <span className="date">
                    {new Date(leftover.expiresAt).toLocaleDateString()}
                  </span>
                </div>

                {/* SOURCE RECIPE */}
                {leftover.sourceRecipe && (
                  <p className="source-recipe">From: {leftover.sourceRecipe}</p>
                )}

                {/* ACTIONS */}
                <div className="leftover-actions">
                  <button
                    className="suggestions-btn"
                    onClick={() => onSuggestionClick?.(leftover)}
                  >
                    💡 Recipes
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(leftover._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* STATS SUMMARY */}
      <div className="pantry-stats">
        <div className="stat">
          <span className="stat-value">{leftovers.length}</span>
          <span className="stat-label">Items Saved</span>
        </div>
        <div className="stat">
          <span className="stat-value">🌱</span>
          <span className="stat-label">Waste Prevention</span>
        </div>
      </div>
    </div>
  );
};

export default LeftoverPantry;
