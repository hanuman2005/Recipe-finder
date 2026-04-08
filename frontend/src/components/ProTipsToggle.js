/**
 * PRO TIPS TOGGLE - React Component (Feature #4 Enhancement)
 *
 * Purpose:
 * Toggle button on recipe detail page to switch between:
 * - Community Tips (user-submitted, moderated)
 * - AI Tips (Grok-generated, always available)
 *
 * Usage:
 * <ProTipsToggle recipeId={recipeId} />
 */

import React, { useState, useEffect } from "react";
import "./ProTipsToggle.css";

/**
 * MAIN COMPONENT
 */
const ProTipsToggle = ({ recipeId }) => {
  // State
  const [activeTab, setActiveTab] = useState("community"); // community or ai
  const [communityTips, setCommunityTips] = useState([]);
  const [aiTips, setAiTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * FETCH TIPS ON MOUNT
   */
  useEffect(() => {
    fetchTips();
  }, [recipeId]);

  /**
   * FETCH BOTH COMMUNITY & AI TIPS
   */
  const fetchTips = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch community tips
      const communityResponse = await fetch(
        `/api/recipes/${recipeId}/pro-tips`,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      if (communityResponse.ok) {
        const communityData = await communityResponse.json();
        setCommunityTips(communityData.data || []);
      }

      // Fetch AI tips
      const aiResponse = await fetch(`/api/recipes/${recipeId}/ai-tips`, {
        headers: { "Content-Type": "application/json" },
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiTips(aiData.data?.tips || []);
      }
    } catch (err) {
      console.error("❌ Error fetching tips:", err);
      setError("Failed to load tips");
    } finally {
      setLoading(false);
    }
  };

  /**
   * RENDER TIP CARD
   */
  const renderTipCard = (tip, index, isAI = false) => (
    <div
      key={index}
      className={`tip-card ${isAI ? "ai-tip" : "community-tip"}`}
    >
      {isAI && <div className="ai-badge">🤖 AI-Suggested</div>}

      <div className="tip-header">
        <h4 className="tip-title">{tip.title}</h4>
        {!isAI && tip.helpfulCount > 0 && (
          <span className="helpful-count">👍 {tip.helpfulCount}</span>
        )}
      </div>

      <p className="tip-explanation">{tip.explanation}</p>

      {tip.stepNumber && <div className="step-info">Step {tip.stepNumber}</div>}

      {!isAI && (
        <div className="tip-meta">
          <span className="by">By {tip.submittedBy?.name || "Anonymous"}</span>
          <span className="date">
            {new Date(tip.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );

  /**
   * RENDER
   */
  return (
    <div className="pro-tips-toggle">
      {/* TOGGLE BUTTONS */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "community" ? "active" : ""}`}
          onClick={() => setActiveTab("community")}
        >
          👥 Community Tips ({communityTips.length})
        </button>
        <button
          className={`tab ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          🤖 AI Tips ({aiTips.length})
        </button>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Loading tips...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && <div className="error-message">{error}</div>}

      {/* COMMUNITY TIPS TAB */}
      {!loading && activeTab === "community" && (
        <div className="tips-content">
          {communityTips.length === 0 ? (
            <div className="empty-state">
              <p>No community tips yet. Be the first to share! 🎉</p>
            </div>
          ) : (
            <div className="tips-list">
              {communityTips.map((tip, idx) => renderTipCard(tip, idx, false))}
            </div>
          )}
        </div>
      )}

      {/* AI TIPS TAB */}
      {!loading && activeTab === "ai" && (
        <div className="tips-content ai-tips">
          {aiTips.length === 0 ? (
            <div className="empty-state">
              <p>AI suggestions loading... 🔄</p>
            </div>
          ) : (
            <div className="tips-list">
              {aiTips.map((tip, idx) => renderTipCard(tip, idx, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProTipsToggle;
