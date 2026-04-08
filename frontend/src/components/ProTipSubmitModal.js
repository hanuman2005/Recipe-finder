// ========== PRO TIP SUBMIT MODAL COMPONENT ==========
// Feature #4: Community submits pro tips for recipe steps
// Form to capture: title, technique, level, temperature, timing, explanation, region, videoUrl

import React, { useState } from "react";
import axios from "axios";

const ProTipSubmitModal = ({ recipeId, stepNumber, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    technique: "",
    level: "Intermediate",
    temperature: "",
    timing: "",
    explanation: "",
    region: "",
    videoUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.explanation) {
      setError("Title and explanation are required");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `/api/recipes/${recipeId}/pro-tips`,
        {
          stepNumber,
          ...formData,
          temperature: formData.temperature
            ? parseInt(formData.temperature)
            : null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error submitting pro tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>⭐ Share Your Pro Tip</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Subtitle */}
        <p style={{ color: "#666", marginBottom: "20px", marginTop: 0 }}>
          Help other cooks learn your secret technique! (Step {stepNumber})
        </p>

        {success ? (
          <div
            style={{
              background: "#D1FAE5",
              color: "#065F46",
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            ✓ Pro tip submitted! Thanks for sharing. It will be reviewed by
            moderators.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: "#FEE2E2",
                  color: "#991B1B",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Technique Name *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Double-Fry Technique"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Technique Description */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Technique Description
              </label>
              <input
                type="text"
                name="technique"
                value={formData.technique}
                onChange={handleChange}
                placeholder="How to do it (brief)"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Level */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Difficulty Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            {/* Temperature & Timing */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="180"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Timing
                </label>
                <input
                  type="text"
                  name="timing"
                  value={formData.timing}
                  onChange={handleChange}
                  placeholder="30 sec x 2"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Explanation */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Why It Works * (The Science)
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                placeholder="Explain the science behind this technique..."
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "Arial, sans-serif",
                }}
              />
            </div>

            {/* Region */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Region/Origin
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="e.g., Hyderabad, Mumbai"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Video URL */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                YouTube Video Link (Optional)
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#10B981",
                  color: "white",
                  padding: "12px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Submitting..." : "Submit Pro Tip"}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  background: "#E5E7EB",
                  color: "#374151",
                  padding: "12px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProTipSubmitModal;
