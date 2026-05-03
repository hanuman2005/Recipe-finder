// ========== PRO TIP SUBMISSION MODEL ==========
// Tracks community-submitted pro tips for moderation
// Feature #4: Street-Style Secret Technique Library

const mongoose = require("mongoose");

const ProTipSubmissionSchema = new mongoose.Schema(
  {
    // ========== REFERENCE TO RECIPE & STEP ==========
    recipe: {
      type: mongoose.Schema.Types.ObjectId, // Recipe being tipped
      ref: "Recipe", // Link to Recipe model
      required: [true, "Recipe ID required"],
    },

    stepNumber: {
      type: Number, // Which step in recipe (1, 2, 3...)
      required: [true, "Step number required"],
      min: 1,
    },

    // ========== USER WHO SUBMITTED ==========
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId, // User who submitted
      ref: "User", // Link to User model
      required: true,
    },

    // ========== PRO TIP CONTENT ==========
    title: {
      type: String, // Technique name (e.g., "Double-Fry Technique")
      required: [true, "Technique title required"],
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    technique: {
      type: String, // Description of the technique
      required: [true, "Technique description required"],
      minlength: [10, "Technique must be at least 10 characters"],
      maxlength: [500, "Technique cannot exceed 500 characters"],
    },

    level: {
      type: String, // Difficulty level of technique
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },

    temperature: {
      type: Number, // Cooking temperature (optional, for frying, baking, etc.)
      min: 0,
      max: 300, // Max reasonable cooking temp
    },

    timing: {
      type: String, // How long to cook (e.g., "30 seconds", "2 minutes each")
      maxlength: 100,
    },

    explanation: {
      type: String, // Why this technique works (the science)
      required: [true, "Explanation required"],
      minlength: [20, "Explanation must be at least 20 characters"],
      maxlength: [500, "Explanation cannot exceed 500 characters"],
    },

    region: {
      type: String, // Where this technique originates (e.g., "Hyderabad", "Mumbai")
      maxlength: 100,
    },

    videoUrl: {
      type: String, // YouTube or user-uploaded video link (optional)
      match: [
        /^(https?:\/\/)?(www\.)?youtube\.com|youtu\.be|vimeo\.com/ || "",
        "Please provide a valid video URL",
      ],
    },

    // ========== MODERATION FIELDS ==========
    status: {
      type: String, // Approval status
      enum: ["pending", "approved", "rejected"],
      default: "pending", // New tips start as pending
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId, // Admin who reviewed
      ref: "User",
    },

    reviewComment: {
      type: String, // Reason for approval/rejection
      maxlength: 500,
    },

    // ========== ENGAGEMENT TRACKING ==========
    helpfulCount: {
      type: Number, // How many users found this helpful
      default: 0,
    },

    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId, // Users who upvoted
        ref: "User",
      },
    ],

    // ========== TIMESTAMPS ==========
    createdAt: {
      type: Date,
      default: Date.now,
    },

    approvedAt: {
      type: Date, // When tip was approved
    },
  },
  { timestamps: true },
);

// ========== INDEXES ==========
// Find pending tips for moderation dashboard
ProTipSubmissionSchema.index({ status: 1, createdAt: -1 });

// Find tips for specific recipe
ProTipSubmissionSchema.index({ recipe: 1, status: 1 });

// Find tips submitted by user
ProTipSubmissionSchema.index({ submittedBy: 1, createdAt: -1 });

// Export model
module.exports = mongoose.model("ProTipSubmission", ProTipSubmissionSchema);
