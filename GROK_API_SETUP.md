/\*\*

- GROK API SETUP GUIDE - FREE TIER
-
- Why Grok?
- ✅ FREE: 1M tokens/month (no credit card needed)
- ✅ POWERFUL: Same quality as paid LLMs
- ✅ EASY: REST API compatible with OpenAI format
- ✅ SCALABLE: Upgrade anytime if needed
-
- This Feature #1 (AI Substitutions) now uses Grok instead of Claude API
  \*/

// ========== STEP 1: GET GROK API KEY ==========
/\*

1. Go to: https://console.x.ai
2. Signup / Login with X account (formerly Twitter)
3. Create a new API key in the dashboard
4. Copy the key (looks like: xai-...)
5. Add to your .env file
   \*/

// ========== STEP 2: UPDATE .ENV FILE ==========

// Before (Claude - paid):
// CLAUDE_API_KEY=sk-...

// After (Grok - FREE):
// GROK_API_KEY=xai-...

// ========== STEP 3: VERIFY SETUP ==========

// Test endpoint:
// GET http://localhost:5000/api/substitutions/health
// Should return: { status: "operational", grokApi: "connected" }

// ========== HOW IT WORKS ==========

/\*

1. User sees missing ingredient on recipe page
2. Clicks "Get Alternatives"
3. Frontend calls: GET /api/substitutions?ingredient=cream&recipe=pasta
4. Backend hits Grok API with cooking prompt
5. Grok returns 3-5 substitute suggestions
6. Frontend displays in SubstitutionModal
7. User picks best substitute ✅

Example Grok Response for "cream":
[
{
name: "Milk + Butter (2:1)",
ratio: "2:1",
explanation: "Emulsion creates rich, creamy texture",
category: "similar_texture",
techniques: "Add butter first, then milk slowly"
},
{
name: "Greek Yogurt",
ratio: "1:1",
explanation: "Rich protein content mimics creaminess",
category: "healthier",
techniques: "Not for high-heat cooking; add at end"
}
]
\*/

// ========== API ENDPOINTS ==========

/\*
GET /api/substitutions?ingredient=cream&recipe=pasta
→ Get 3-5 substitutes for ingredient in recipe

GET /api/substitutions/explain?original=cream&substitute=greek_yogurt&recipe=pasta
→ Get detailed cooking instructions for substitute

POST /api/substitutions/batch
Body: {
missingIngredients: ["cream", "paneer"],
recipeName: "Butter Chicken"
}
→ Get substitutes for multiple ingredients at once

POST /api/substitutions/validate
Body: {
original: "cream",
substitute: "greek_yogurt",
recipe: "pasta"
}
→ Check if substitution would work (returns feasibility rating)

GET /api/substitutions/diet?ingredient=cream&diet=vegan&recipe=pasta
→ Get diet-friendly substitutes (vegan, keto, gluten-free, etc.)

GET /api/substitutions/health
→ Verify Grok API is working
\*/

// ========== FREE TIER LIMITS ==========

/\*
Grok Free Tier:

- 1M tokens/month
- No credit card required
- Response limit: ~2000 characters (our substitutions avg 500 chars)

Rough calculation:

- 1 substitution request = ~300 tokens
- 1M tokens = ~3,300 requests/month
- If 100 users use feature daily = 3,000 requests = Still within limit! ✅

If you exceed or want higher limits:
Paid tier: $5-20/month depending on token usage
\*/

// ========== COST COMPARISON ==========

/\*
Claude API (previous):

- $0.003/1K input tokens
- $0.015/1K output tokens
- ~1 request = $0.05-0.10

Grok API (current):

- FREE: 1M tokens/month
- PAID: Starting $5/month
- vs Claude: 50-100x cheaper

For this demo/portfolio: FREE tier is perfect!
\*/

// ========== MIGRATION SUMMARY ==========

/\*
Files Updated:
✅ backend/services/substitutionService.js

- Removed Anthropic SDK import
- Added Grok REST API calls via fetch
- Updated callGrokForSubstitutes() function
- Updated callGrok() helper function
- Migrated getSubstitutionExplanation()
- Migrated validateSubstitution()
- Migrated getSubsByDiet()

✅ backend/controllers/substitutionController.js

- Updated health check to verify GROK_API_KEY

No changes needed:

- Routes remain the same
- Frontend components unchanged
- API endpoints unchanged
- Response format unchanged

So from user's perspective = NO CHANGES!
Just better pricing 💰
\*/

// ========== TROUBLESHOOTING ==========

/\*
Q: I got "GROK_API_KEY not configured"
A: Make sure GROK_API_KEY is in your .env file (not CLAUDE_API_KEY)

Q: I got "Grok API error: 401 Unauthorized"
A: Check your API key is correct. No typos or spaces.

Q: I got "Grok API error: 429 Rate Limit"
A: You hit the free tier limit. Wait till next month or upgrade to paid.

Q: Can I still use Claude?
A: Yes! You can switch back by:

1.  Reverting substitutionService.js from git
2.  Using CLAUDE_API_KEY=sk-... in .env
    But we recommend Grok for free tier projects.
    \*/

module.exports = {
API_KEY_ENV_VAR: "GROK_API_KEY",
API_URL: "https://api.x.ai/v1/chat/completions",
MODEL: "grok-2-1212",
FREE_TIER_TOKENS: "1M tokens/month",
FREE: true,
};
