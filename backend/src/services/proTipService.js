// ========== PRO TIP SERVICE - BUSINESS LOGIC LAYER ==========
// Handles pro tip submission, approval, and retrieval
// Feature #4: Street-Style Secret Technique Library

const ProTipSubmission = require("../models/ProTipSubmission");
const Recipe = require("../models/Recipe");
const AppError = require("../utils/AppError");

class ProTipService {
  /**
   * FUNCTION: Submit a pro tip for a recipe step
   * Community user submits technique tip for moderation
   * @param {String} recipeId - Recipe MongoDB ID
   * @param {Number} stepNumber - Step number in recipe
   * @param {String} userId - User submitting the tip
   * @param {Object} tipData - Pro tip content
   * @returns {Object} Created ProTipSubmission document
   * @throws {Error} If recipe/step not found
   */
  async submitProTip(recipeId, stepNumber, userId, tipData) {
    // ========== VALIDATE RECIPE EXISTS ==========
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    // ========== VALIDATE STEP EXISTS ==========
    const step = recipe.steps.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      throw AppError.badRequest("Step not found in recipe", "STEP_NOT_FOUND", {
        stepNumber,
        totalSteps: recipe.steps.length,
      });
    }

    // ========== VALIDATE TIP DATA ==========
    if (!tipData.title || !tipData.explanation) {
      throw AppError.badRequest(
        "Title and explanation required",
        "MISSING_TIP_FIELDS",
      );
    }

    // ========== CREATE PRO TIP SUBMISSION ==========
    const proTipSubmission = await ProTipSubmission.create({
      recipe: recipeId,
      stepNumber,
      submittedBy: userId,
      title: tipData.title,
      technique: tipData.technique,
      level: tipData.level || "Intermediate",
      temperature: tipData.temperature,
      timing: tipData.timing,
      explanation: tipData.explanation,
      region: tipData.region,
      videoUrl: tipData.videoUrl,
      status: "pending", // Always start as pending for review
    });

    // Populate user info
    await proTipSubmission.populate("submittedBy", "name email avatar");

    return proTipSubmission;
  }

  /**
   * FUNCTION: Get approved pro tips for a recipe step
   * Only returns approved tips visible to users
   * @param {String} recipeId - Recipe MongoDB ID
   * @param {Number} stepNumber - Step number (optional, filter specific step)
   * @returns {Array} Array of approved ProTipSubmission documents
   */
  async getApprovedProTips(recipeId, stepNumber = null) {
    // ========== BUILD QUERY ==========
    const query = {
      recipe: recipeId,
      status: "approved", // Only approved tips
    };

    // Filter by step if provided
    if (stepNumber) {
      query.stepNumber = stepNumber;
    }

    // ========== FETCH & SORT BY HELPFULNESS ==========
    const proTips = await ProTipSubmission.find(query)
      .populate("submittedBy", "name email avatar") // Show who submitted
      .sort({ helpfulCount: -1, upvotes: -1, approvedAt: -1 }) // Most helpful first
      .exec();

    return proTips;
  }

  /**
   * FUNCTION: Get pending pro tips for moderation
   * Admin/Moderator views submissions awaiting review
   * @param {Number} page - Pagination page number
   * @param {Number} limit - Results per page
   * @returns {Object} {data: tips[], pagination: {total, page, limit, pages}}
   */
  async getPendingProTips(page = 1, limit = 20) {
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const [tips, total] = await Promise.all([
      ProTipSubmission.find({ status: "pending" })
        .populate("submittedBy", "name email")
        .populate("recipe", "title")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      ProTipSubmission.countDocuments({ status: "pending" }),
    ]);

    return {
      data: tips,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * FUNCTION: Approve pro tip submission
   * Admin/Moderator approves tip and makes it visible to users
   * @param {String} tipId - ProTipSubmission MongoDB ID
   * @param {String} adminId - Admin/Moderator user ID
   * @param {String} comment - Optional approval comment
   * @returns {Object} Updated ProTipSubmission
   * @throws {Error} If tip not found or already reviewed
   */
  async approveProTip(tipId, adminId, comment = "") {
    // ========== FIND TIP ==========
    const proTip = await ProTipSubmission.findById(tipId);
    if (!proTip) {
      throw AppError.notFound("Pro tip not found", "TIP_NOT_FOUND", { tipId });
    }

    // ========== PREVENT DOUBLE APPROVAL ==========
    if (proTip.status !== "pending") {
      throw AppError.badRequest(
        `Tip already ${proTip.status}`,
        "TIP_ALREADY_REVIEWED",
      );
    }

    // ========== UPDATE STATUS ==========
    proTip.status = "approved";
    proTip.reviewedBy = adminId;
    proTip.reviewComment = comment;
    proTip.approvedAt = new Date();

    await proTip.save();
    return proTip;
  }

  /**
   * FUNCTION: Reject pro tip submission
   * Admin/Moderator rejects tip and removes from view
   * @param {String} tipId - ProTipSubmission MongoDB ID
   * @param {String} adminId - Admin/Moderator user ID
   * @param {String} reason - Reason for rejection
   * @returns {Object} Updated ProTipSubmission
   * @throws {Error} If tip not found or already reviewed
   */
  async rejectProTip(tipId, adminId, reason = "") {
    // ========== FIND TIP ==========
    const proTip = await ProTipSubmission.findById(tipId);
    if (!proTip) {
      throw AppError.notFound("Pro tip not found", "TIP_NOT_FOUND", { tipId });
    }

    // ========== PREVENT DOUBLE REJECTION ==========
    if (proTip.status !== "pending") {
      throw AppError.badRequest(
        `Tip already ${proTip.status}`,
        "TIP_ALREADY_REVIEWED",
      );
    }

    // ========== UPDATE STATUS ==========
    proTip.status = "rejected";
    proTip.reviewedBy = adminId;
    proTip.reviewComment = reason;

    await proTip.save();
    return proTip;
  }

  /**
   * FUNCTION: Mark pro tip as helpful
   * User upvotes a pro tip
   * @param {String} tipId - ProTipSubmission MongoDB ID
   * @param {String} userId - User upvoting
   * @returns {Object} Updated ProTipSubmission
   */
  async markTipHelpful(tipId, userId) {
    // ========== FIND TIP ==========
    const proTip = await ProTipSubmission.findById(tipId);
    if (!proTip) {
      throw AppError.notFound("Pro tip not found", "TIP_NOT_FOUND", { tipId });
    }

    // ========== CHECK IF ALREADY UPVOTED ==========
    const alreadyUpvoted = proTip.upvotes.includes(userId);
    if (alreadyUpvoted) {
      // Remove upvote
      proTip.upvotes = proTip.upvotes.filter((id) => id.toString() !== userId);
      proTip.helpfulCount = Math.max(0, proTip.helpfulCount - 1);
    } else {
      // Add upvote
      proTip.upvotes.push(userId);
      proTip.helpfulCount += 1;
    }

    await proTip.save();
    return proTip;
  }

  /**
   * FUNCTION: Get pro tips submitted by a user
   * User views their own submissions
   * @param {String} userId - User MongoDB ID
   * @returns {Array} Array of ProTipSubmission documents
   */
  async getUserProTips(userId) {
    const proTips = await ProTipSubmission.find({ submittedBy: userId })
      .populate("recipe", "title")
      .sort({ createdAt: -1 });

    return proTips;
  }

  /**
   * FUNCTION: Generate AI-Powered Pro Tips for Recipe
   * Feature #4 Enhancement: Uses Grok AI to generate cooking tips
   * AI tips are marked distinctly and shown alongside community tips
   *
   * @param {String} recipeId - Recipe MongoDB ID
   * @param {Number} stepNumber - Specific step number (optional, for all if null)
   * @returns {Array} AI-generated pro tips for the recipe/step
   * @throws {Error} If recipe not found or AI call fails
   */
  async generateAIProTips(recipeId, stepNumber = null) {
    // ========== VALIDATE RECIPE EXISTS ==========
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    // ========== VALIDATE STEP IF PROVIDED ==========
    let targetSteps = recipe.steps;
    if (stepNumber) {
      const step = recipe.steps.find((s) => s.stepNumber === stepNumber);
      if (!step) {
        throw AppError.badRequest(
          "Step not found in recipe",
          "STEP_NOT_FOUND",
          {
            stepNumber,
            totalSteps: recipe.steps.length,
          },
        );
      }
      targetSteps = [step];
    }

    // ========== BUILD PROMPT FOR GROK ==========
    let stepsText = targetSteps
      .map((s) => `Step ${s.stepNumber}: ${s.instruction}`)
      .join("\n");

    const prompt = `You are a professional chef. For this recipe: "${recipe.title}"

${stepsText}

Generate 3 professional cooking pro tips/techniques for these steps. Format as JSON array:
[
  {
    "stepNumber": 1,
    "title": "technique name",
    "explanation": "detailed explanation with cooking science"
  }
]

IMPORTANT: Return ONLY valid JSON array, no other text.`;

    // ========== CALL GROK API ==========
    const GROK_API_KEY = process.env.GROK_API_KEY;
    if (!GROK_API_KEY) {
      throw AppError.internalError(
        "GROK_API_KEY not configured",
        "API_CONFIG_ERROR",
      );
    }

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-2-1212",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Grok API error: ${errorData.error?.message || response.statusText}`,
        );
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || "";

      // ========== PARSE RESPONSE ==========
      const aiTips = JSON.parse(responseText);

      // ========== FORMAT TIPS WITH AI BADGE ==========
      return aiTips.map((tip) => ({
        stepNumber: tip.stepNumber,
        title: tip.title,
        explanation: tip.explanation,
        source: "ai_generated",
        badge: "🤖 AI-Suggested",
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error(`❌ Error generating AI tips:`, error.message);
      throw AppError.internalError(
        "Failed to generate AI pro tips",
        "AI_TIP_GENERATION_FAILED",
      );
    }
  }
}

module.exports = new ProTipService();
