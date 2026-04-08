// ========== PRO TIP MODERATION DASHBOARD (ADMIN) ==========
// Feature #4: Admin reviews and approves/rejects community pro tips

import React, { useState, useEffect } from "react";
import axios from "axios";

const ProTipModerationDashboard = () => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [reviewingTipId, setReviewingTipId] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingTips();
  }, [page]);

  const fetchPendingTips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/admin/pro-tips/pending?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTips(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching pending tips:", error);
      alert("Error loading tips");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tipId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `/api/admin/pro-tips/${tipId}/approve`,
        { comment: reviewComment },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("✓ Pro tip approved!");
      setReviewingTipId(null);
      setReviewComment("");
      fetchPendingTips();
    } catch (error) {
      alert("Error approving tip");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (tipId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `/api/admin/pro-tips/${tipId}/reject`,
        { reason: reviewComment },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("✗ Pro tip rejected");
      setReviewingTipId(null);
      setReviewComment("");
      fetchPendingTips();
    } catch (error) {
      alert("Error rejecting tip");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && tips.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>Loading pending pro tips...</p>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          background: "#F3F4F6",
          borderRadius: "8px",
        }}
      >
        <h3>✓ All caught up!</h3>
        <p>No pending pro tips to review</p>
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: "8px", padding: "20px" }}>
      <h2 style={{ marginTop: 0 }}>⭐ Pro Tips Moderation Queue</h2>
      <p style={{ color: "#666" }}>
        {tips.length} of {pagination?.total} pending tips
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {tips.map((tip) => (
          <div
            key={tip._id}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "16px",
              background: "#FAFAFA",
            }}
          >
            {/* Tip Info */}
            <div style={{ marginBottom: "12px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "4px" }}>{tip.title}</h4>
              <p style={{ color: "#666", margin: "4px 0", fontSize: "14px" }}>
                <strong>Submitted by:</strong> {tip.submittedBy?.name}
              </p>
              <p style={{ color: "#666", margin: "4px 0", fontSize: "14px" }}>
                <strong>Recipe:</strong> {tip.recipe?.title}
              </p>
              <p style={{ color: "#666", margin: "4px 0", fontSize: "14px" }}>
                <strong>Step:</strong> {tip.stepNumber}
              </p>
            </div>

            {/* Technique Content */}
            <div
              style={{
                background: "white",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "12px",
                borderLeft: "4px solid #F59E0B",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Technique:</strong> {tip.technique}
              </p>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Level:</strong> {tip.level}
              </p>
              {tip.temperature && (
                <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                  <strong>Temperature:</strong> {tip.temperature}°C
                </p>
              )}
              {tip.timing && (
                <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                  <strong>Timing:</strong> {tip.timing}
                </p>
              )}
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Explanation:</strong> {tip.explanation}
              </p>
              {tip.region && (
                <p style={{ margin: "0 0 0px 0", fontSize: "14px" }}>
                  <strong>Region:</strong> {tip.region}
                </p>
              )}
            </div>

            {/* Review Section */}
            {reviewingTipId === tip._id ? (
              <div
                style={{
                  background: "#FEF3C7",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Review Comment (Optional):
                </p>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add a comment for the user..."
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "4px",
                    fontFamily: "Arial, sans-serif",
                    marginBottom: "8px",
                    boxSizing: "border-box",
                  }}
                  rows="3"
                />
              </div>
            ) : null}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              {reviewingTipId === tip._id ? (
                <>
                  <button
                    onClick={() => handleApprove(tip._id)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      background: "#10B981",
                      color: "white",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: actionLoading ? "wait" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {actionLoading ? "Processing..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(tip._id)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      background: "#EF4444",
                      color: "white",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: actionLoading ? "wait" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {actionLoading ? "Processing..." : "✗ Reject"}
                  </button>
                  <button
                    onClick={() => {
                      setReviewingTipId(null);
                      setReviewComment("");
                    }}
                    style={{
                      background: "#E5E7EB",
                      color: "#374151",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setReviewingTipId(tip._id)}
                  style={{
                    flex: 1,
                    background: "#3B82F6",
                    color: "white",
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              background: page === 1 ? "#E5E7EB" : "#3B82F6",
              color: page === 1 ? "#999" : "white",
              padding: "8px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: page === 1 ? "default" : "pointer",
            }}
          >
            Previous
          </button>
          <span style={{ padding: "8px 12px", fontWeight: "bold" }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            style={{
              background: page === pagination.pages ? "#E5E7EB" : "#3B82F6",
              color: page === pagination.pages ? "#999" : "white",
              padding: "8px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: page === pagination.pages ? "default" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProTipModerationDashboard;
