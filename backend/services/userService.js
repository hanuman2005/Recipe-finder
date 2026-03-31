/**
 * User Service
 * Handles user-related operations: profile, favorites, preferences
 */

const User = require("../models/User");
const Recipe = require("../models/Recipe");
const AppError = require("../utils/AppError");

class UserService {
  /**
   * Get user profile with stats
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId)
      .select("-password")
      .populate("favorites", "title category state");

    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Add stats
    const recipesCount = await Recipe.countDocuments({ user: userId });
    const favoritesCount = user.favorites?.length || 0;

    return {
      ...user.toObject(),
      stats: {
        recipes: recipesCount,
        favorites: favoritesCount,
        joined: user.createdAt,
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    // Prevent changing email/password
    delete updateData.email;
    delete updateData.password;
    delete updateData.role;
    delete updateData.createdAt;

    // Allowed fields to update
    const allowedFields = ["name", "bio", "profilePicture", "location"];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    return user;
  }

  /**
   * Get user's favorite recipes
   */
  async getFavorites(userId) {
    const user = await User.findById(userId).populate({
      path: "favorites",
      select: "title description category state image user",
      populate: {
        path: "user",
        select: "name",
      },
    });

    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    return user.favorites || [];
  }

  /**
   * Add recipe to favorites
   */
  async addFavorite(userId, recipeId) {
    // Check if recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", { recipeId });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Check if already favorited
    if (user.favorites.includes(recipeId)) {
      throw AppError.conflict(
        "Recipe is already in favorites",
        "ALREADY_FAVORITED",
        { recipeId }
      );
    }

    // Add to favorites
    user.favorites.push(recipeId);
    await user.save();

    return { message: "Added to favorites" };
  }

  /**
   * Remove recipe from favorites
   */
  async removeFavorite(userId, recipeId) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Check if in favorites
    if (!user.favorites.includes(recipeId)) {
      throw AppError.badRequest(
        "Recipe is not in favorites",
        "NOT_FAVORITED",
        { recipeId }
      );
    }

    // Remove from favorites
    user.favorites = user.favorites.filter((id) => id.toString() !== recipeId);
    await user.save();

    return { message: "Removed from favorites" };
  }

  /**
   * Check if recipe is favorited
   */
  async isFavorited(userId, recipeId) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    return user.favorites.includes(recipeId);
  }

  /**
   * Get user's recipes
   */
  async getUserRecipes(userId, page = 1, limit = 10) {
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
      Recipe.find({ user: userId })
        .populate("user", "name")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Recipe.countDocuments({ user: userId }),
    ]);

    return {
      data: recipes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get users list (for admin)
   */
  async getUsers(page = 1, limit = 10) {
    if (page < 1 || limit < 1) {
      throw AppError.badRequest(
        "Page and limit must be greater than 0",
        "INVALID_PAGINATION",
        { page, limit }
      );
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search users
   */
  async searchUsers(query) {
    if (!query || query.trim().length === 0) {
      throw AppError.badRequest(
        "Search query is required",
        "EMPTY_QUERY",
        { minLength: 1 }
      );
    }

    return await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(10);
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Delete user's recipes first (optional - can cascade)
    await Recipe.deleteMany({ user: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    return { message: "Account deleted successfully" };
  }
}

module.exports = new UserService();