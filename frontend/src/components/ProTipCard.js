// ========== PRO TIP CARD COMPONENT ==========
// Feature #4: Display approved pro tips on recipe steps
// Shows technique with temperature, timing, explanation, region, video

import React, { useState } from "react";
import axios from "axios";

const ProTipCard = ({ tip, userId, onHelpfulClick }) => {
  const [isHelpful, setIsHelpful] = useState(
    tip.upvotes?.includes(userId) || false,
  );
  const [helpfulCount, setHelpfulCount] = useState(tip.helpfulCount || 0);
  const [loading, setLoading] = useState(false);

  const handleMarkHelpful = async () => {
    try {
      setLoading(true);
      await axios.post(
        `/api/pro-tips/${tip._id}/helpful`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      if (!isHelpful) {
        setHelpfulCount(helpfulCount + 1);
      } else {
        setHelpfulCount(Math.max(0, helpfulCount - 1));
      }
      setIsHelpful(!isHelpful);
      onHelpfulClick?.();
    } catch (error) {
      console.error("Error marking helpful:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#FEF3C7",
        border: "2px solid #F59E0B",
        borderRadius: "8px",
        padding: "16px",
        marginTop: "12px",
        marginBottom: "12px",
      }}
    >
      {/* Header: Title + Level Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "20px" }}>⭐</span>
        <h4 style={{ margin: "0", color: "#92400E" }}>{tip.title}</h4>
        <span
          style={{
            background:
              tip.level === "Advanced"
                ? "#EF4444"
                : tip.level === "Intermediate"
                  ? "#F59E0B"
                  : "#10B981",
            color: "white",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {tip.level}
        </span>
      </div>

      {/* Technique Description */}
      <p style={{ color: "#92400E", marginBottom: "10px", fontSize: "14px" }}>
        {tip.technique}
      </p>

      {/* Key Details: Temperature, Timing */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "10px",
          fontSize: "13px",
        }}
      >
        {tip.temperature && (
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            <strong>🌡️ Temperature:</strong> {tip.temperature}°C
          </div>
        )}
        {tip.timing && (
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            <strong>⏱️ Timing:</strong> {tip.timing}
          </div>
        )}
      </div>

      {/* Why It Works */}
      <div
        style={{
          background: "rgba(255,255,255,0.7)",
          padding: "10px",
          borderRadius: "4px",
          marginBottom: "10px",
        }}
      >
        <strong style={{ color: "#92400E" }}>Why it works:</strong>
        <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#92400E" }}>
          {tip.explanation}
        </p>
      </div>

      {/* Region + Video Link */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "10px",
          fontSize: "13px",
        }}
      >
        {tip.region && (
          <span
            style={{
              background: "rgba(255,255,255,0.7)",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            📍 {tip.region}
          </span>
        )}
        {tip.videoUrl && (
          <a
            href={tip.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#EF4444",
              color: "white",
              padding: "4px 10px",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "12px",
            }}
          >
            ▶ Watch Video
          </a>
        )}
      </div>

      {/* Footer: Submitted By + Helpful Count + Mark Helpful Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(0,0,0,0.1)",
          paddingTop: "10px",
          fontSize: "12px",
        }}
      >
        <div>
          <span style={{ color: "#92400E" }}>
            By <strong>{tip.submittedBy?.name || "Anonymous"}</strong>
          </span>
          <span style={{ marginLeft: "10px", color: "#D97706" }}>
            👍 {helpfulCount} found helpful
          </span>
        </div>
        <button
          onClick={handleMarkHelpful}
          disabled={loading}
          style={{
            background: isHelpful ? "#10B981" : "#E5E7EB",
            color: isHelpful ? "white" : "#374151",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            cursor: loading ? "wait" : "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {isHelpful ? "✓ Helpful" : "👍 Helpful"}
        </button>
      </div>
    </div>
  );
};

export default ProTipCard;
