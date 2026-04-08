// ========== RECIPE STEP WITH PRO TIPS COMPONENT ==========
// Feature #4: Display recipe steps with community pro tips
// Shows step number, description, pro tips, and submit form

import React, { useState, useEffect } from "react";
import axios from "axios";
import ProTipCard from "./ProTipCard";
import ProTipSubmitModal from "./ProTipSubmitModal";

const RecipeStepWithProTips = ({ recipe, step, userId }) => {
  const [proTips, setProTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    fetchProTips();
  }, [recipe._id, step.stepNumber]);

  const fetchProTips = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/recipes/${recipe._id}/pro-tips?stepNumber=${step.stepNumber}`,
      );
      setProTips(response.data.data || []);
    } catch (error) {
      console.error("Error fetching pro tips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTipSubmitted = () => {
    fetchProTips();
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Step Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {/* Step Number Circle */}
        <div
          style={{
            background: "#3B82F6",
            color: "white",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          {step.stepNumber}
        </div>

        {/* Step Description */}
        <div style={{ flex: 1 }}>
          <p
            style={{ margin: "0 0 8px 0", fontSize: "16px", lineHeight: "1.6" }}
          >
            {step.description}
          </p>
          {step.duration && (
            <span
              style={{
                background: "#EFF6FF",
                color: "#1E40AF",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            >
              ⏱️ {step.duration} minutes
            </span>
          )}
        </div>
      </div>

      {/* Pro Tips Section */}
      {proTips.length > 0 && (
        <div style={{ marginLeft: "44px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "18px" }}>⭐</span>
            <span style={{ fontWeight: "bold", color: "#F59E0B" }}>
              {proTips.length} Pro {proTips.length === 1 ? "Tip" : "Tips"}
            </span>
          </div>

          {proTips.map((tip) => (
            <ProTipCard
              key={tip._id}
              tip={tip}
              userId={userId}
              onHelpfulClick={fetchProTips}
            />
          ))}
        </div>
      )}

      {/* Submit Pro Tip Button */}
      <div style={{ marginLeft: "44px", marginTop: "12px" }}>
        {proTips.length === 0 && !loading && (
          <p style={{ color: "#999", fontSize: "14px", marginBottom: "8px" }}>
            No pro tips yet for this step
          </p>
        )}
        <button
          onClick={() => setShowSubmitModal(true)}
          style={{
            background: "white",
            border: "2px dashed #F59E0B",
            padding: "10px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#F59E0B",
            transitions: "all 0.2s",
          }}
        >
          ✎ Share Your Pro Tip
        </button>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <ProTipSubmitModal
          recipeId={recipe._id}
          stepNumber={step.stepNumber}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={handleTipSubmitted}
        />
      )}
    </div>
  );
};

export default RecipeStepWithProTips;
