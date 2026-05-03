# Recipe Finder — Features Roadmap

## Priority Order
Build in this sequence. Each level feeds data into the next.

1. Cook Mode + Recipe Scaling ← start here
2. Dietary Profiles
3. Nutrition Analysis
4. Content-Based Recommendations
5. User Preference Modeling
6. Meal Planner
7. Ingredient Photo → Recipe
8. Seasonal Surfacing
9. Search Ranking (Elasticsearch)
10. Collaborative Filtering ← do last, needs many users

---

## Your Proposed Features

### 1. Recipe Recommendation Engine
**Collaborative filtering** — "Users who liked what you liked, also liked X." Needs lots of users with ratings/favorites data first. Cold-start problem: works poorly with few users.

**Content-based filtering** — "You liked spicy chicken dishes, here are more spicy chicken dishes." Uses recipe properties (ingredients, cuisine, difficulty). No user-count dependency. Build this first.

**Status:** Build content-based now. Save collaborative for later when user base grows.

---

### 2. Ingredient Clustering / Substitution Predictions
Group ingredients by similarity (flavor, texture, nutrition) — e.g., "cream / coconut cream / cashew cream" cluster together. Then predict substitutes automatically based on cluster.

You already have Claude API doing AI substitutions. Clustering would make substitutions smarter and work offline. Skip unless you want to replace Claude calls.

**Status:** Low priority. Existing Claude substitution is good enough.

---

### 3. User Preference Modeling
Track what each user actually does — what they favorite, what they cook, what cuisine they click most. Build a preference profile silently in the background. Use that profile to personalize homepage, search results, recommendations.

No surveys needed. Behavior tells you everything.

**Status:** Medium priority. Implement after Cook Mode (need cook-completion events as data).

---

### 4. Nutrition Analysis / Optimization
For each recipe, show calories, protein, carbs, fat, fiber. Pull data from USDA FoodData Central API (free) matched to each ingredient. Sum across all ingredients for full recipe nutrition.

"Optimization" means: suggest recipe swaps to hit a calorie/macro goal for the day.

**Status:** High priority. Easy to add. No ML needed, just API calls.

---

### 5. Search Ranking Improvements
Current: MongoDB weighted text search (title 10x, description 5x, ingredients 3x). Already solid.

Next level: add user behavior signals — recipes cooked more often rank higher. Personalized ranking — surface recipes matching user's preference profile first.

Future: swap MongoDB text search for Elasticsearch for full-text fuzzy matching, typo tolerance, faceted filters.

**Status:** Incremental. Current search is fine. Elasticsearch swap is a bigger project, do later.

---

## Additional Features (Suggested)

### 6. Cook Mode ⭐ Build First
Step-by-step fullscreen view of a recipe. One step at a time. Per-step countdown timer (e.g., "simmer 10 minutes" → start timer). Mark steps complete. At end, log "cooked this recipe."

Why first: every cook-completion event = data for preferences, recommendations, habit tracking.

**Effort:** Low. No new backend needed. Frontend only.

---

### 7. Recipe Scaling ⭐ Build First
User sets serving count (e.g., recipe is for 4, user wants 2). All ingredient quantities auto-multiply/divide. Simple math on existing ingredient data.

**Effort:** Very low. One calculation on frontend.

---

### 8. Dietary Profiles
User saves their dietary rules — vegan, keto, gluten-free, nut allergy, etc. App remembers and auto-filters all recipes accordingly. No manual filtering every visit.

One extra field on User model. Filter applied to every recipe query.

**Effort:** Low. Small schema change + filter middleware.

---

### 9. Meal Planner
Weekly calendar grid. Drag recipes onto days (Monday breakfast, Monday lunch, etc.). App calculates total nutrition for the week. Button generates combined shopping list from all planned recipes.

High value for habit-forming users. Keeps them coming back daily.

**Effort:** Medium. New UI component + simple backend to save plan per user.

---

### 10. Ingredient Photo → Recipe
User takes photo of fridge/pantry. App sends image to Claude Vision API. Claude returns list of detected ingredients. App searches recipes using those ingredients.

You already have Claude integration. Adding vision is just a different API call.

**Effort:** Low-medium. Strong demo/portfolio feature.

---

### 11. Seasonal Surfacing
Tag each ingredient with what season it's best in and what region (e.g., mangoes → summer, South India). When user searches or browses, boost recipes using currently-in-season ingredients.

Makes app feel alive and locally relevant.

**Effort:** Low. Add season tags to ingredient model, boost factor in search.

---

## Status Tracker

| Feature | Status | Priority |
|---------|--------|----------|
| Cook Mode | Not started | P1 |
| Recipe Scaling | Not started | P1 |
| Dietary Profiles | Not started | P2 |
| Nutrition Analysis | Not started | P2 |
| Content-Based Recommendations | Not started | P3 |
| User Preference Modeling | Not started | P3 |
| Meal Planner | Not started | P4 |
| Ingredient Photo → Recipe | Not started | P4 |
| Seasonal Surfacing | Not started | P4 |
| Search Ranking (Elasticsearch) | Partial (MongoDB weighted) | P5 |
| Collaborative Filtering | Not started | P6 — do last |
| Ingredient Clustering | Not started | P6 — skip unless needed |

---

## Data Dependencies
```
Cook Mode events
    └── User Preference Model
            └── Content-Based Recommendations
                    └── Collaborative Filtering (needs many users)

Nutrition Analysis
    └── Meal Planner (weekly nutrition totals)

Dietary Profiles
    └── Filters all: Search, Recommendations, Meal Planner
```
