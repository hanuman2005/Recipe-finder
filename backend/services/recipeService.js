const Recipe = require("../models/Recipe");
const User = require("../models/User");
const AppError = require("../utils/AppError");

class RecipeService {
  // ==================== READ ====================

  async getRecipeById(id, userId) {
    const recipe = await Recipe.findById(id).populate("user", "name email");
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { id });
    }
    return recipe;
  }

  async getAllRecipes(filters = {}, page = 1, limit = 10) {
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.state) query.state = filters.state;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .populate("user", "name email")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Recipe.countDocuments(query),
    ]);

    return {
      data: recipes,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getRecipesByCategory(category) {
    if (!category) {
      throw AppError.badRequest(
        "Category required",
        "MISSING_CATEGORY",
        { required: true }
      );
    }
    const recipes = await Recipe.find({ category })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    if (!recipes || recipes.length === 0) {
      throw AppError.notFound(
        "No recipes found for this category",
        "NO_RECIPES_FOUND",
        { category }
      );
    }

    return recipes;
  }

  async getRecipesByState(state) {
    if (!state) {
      throw AppError.badRequest(
        "State required",
        "MISSING_STATE",
        { required: true }
      );
    }

    const recipes = await Recipe.find({ state })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    if (!recipes || recipes.length === 0) {
      throw AppError.notFound(
        "No recipes found for this state",
        "NO_RECIPES_FOUND",
        { state }
      );
    }

    return recipes;
  }

  async searchRecipes(query) {
    if (!query || !query.trim()) {
      throw AppError.badRequest(
        "Search query required",
        "EMPTY_QUERY",
        { minLength: 1 }
      );
    }
    return await Recipe.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).populate("user", "name email");
  }

  async getUserRecipes(userId) {
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    return await Recipe.find({ user: userId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
  }

  async getUserFavorites(userId) {
    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }
    return user.favorites || [];
  }

  // ==================== CREATE ====================

  async createRecipe(data, userId) {
    const {
      title,
      description,
      ingredients,
      steps,
      category,
      state,
      benefits,
      image,
    } = data;

    if (!title || !description) {
      throw AppError.badRequest(
        "Title and description required",
        "MISSING_FIELDS",
        { fields: ["title", "description"] }
      );
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw AppError.badRequest(
        "Ingredients required and must be an array",
        "MISSING_INGREDIENTS",
        { minItems: 1 }
      );
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      throw AppError.badRequest(
        "Steps required and must be an array",
        "MISSING_STEPS",
        { minItems: 1 }
      );
    }

    const recipe = await Recipe.create({
      title,
      description,
      ingredients,
      steps,
      category: category || "Other",
      state: state || "Unknown",
      benefits: benefits || "",
      image: image || "",
      user: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await recipe.populate("user", "name email");
  }

  // ==================== UPDATE ====================

  async updateRecipe(id, data, userId) {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { id });
    }

    if (recipe.user.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to update this recipe",
        "FORBIDDEN_UPDATE",
        { id, userId }
      );
    }

    delete data.user;
    delete data.createdAt;
    data.updatedAt = new Date();

    return await Recipe.findByIdAndUpdate(id, data, { new: true }).populate(
      "user",
      "name email",
    );
  }

  async addToFavorites(recipeId, userId) {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { recipeId });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    if (!user.favorites.includes(recipeId)) {
      user.favorites.push(recipeId);
      await user.save();
    }
    return user.favorites;
  }

  async removeFromFavorites(recipeId, userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== recipeId);
    await user.save();
    return user.favorites;
  }

  // ==================== DELETE ====================

  async deleteRecipe(id, userId) {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { id });
    }

    if (recipe.user.toString() !== userId) {
      throw AppError.forbidden(
        "Not authorized to delete this recipe",
        "FORBIDDEN_DELETE",
        { id, userId }
      );
    }

    await Recipe.findByIdAndDelete(id);
  }
}

module.exports = new RecipeService();
  // ==================== READ ====================
