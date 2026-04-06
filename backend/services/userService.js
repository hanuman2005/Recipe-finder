// ========== USER SERVICE - BUSINESS LOGIC LAYER ==========
// Handles all user-related database operations:
// 1. Profile management (retrieve, update user info)
// 2. Favorites management (add, remove, check favorites)
// 3. Recipe management (get user's recipes with pagination)
// 4. Admin operations (list users, search users, delete accounts)

const User = require("../models/User"); // User MongoDB model
const Recipe = require("../models/Recipe"); // Recipe MongoDB model
const AppError = require("../utils/AppError"); // Custom error class

// Singleton service instance - all user operations go through this class
class UserService {
  // ========== PROFILE OPERATIONS ==========
  // Retrieve and manage user profile information

  /**
   * FUNCTION: Get user profile with statistics
   * Fetches user profile (without password), populates favorites, and adds stats
   * @param {String} userId - User's MongoDB ID
   * @returns {Object} User document with:
   *   - name, email, bio, profilePicture, location, createdAt
   *   - favorites (populated with recipe titles)
   *   - stats: {recipes: count, favorites: count, joined: date}
   * @throws {Error} If user not found
   */
  async getUserProfile(userId) {
    // Find user by ID, exclude password field (security), populate favorite recipes titles
    const user = await User.findById(userId)
      .select("-password") // Exclude password field
      .populate("favorites", "title category state"); // Replace IDs with recipe data

    // If user doesn't exist, throw NotFound error (404)
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== CALCULATE STATISTICS ==========
    // Count recipes created by this user
    const recipesCount = await Recipe.countDocuments({ user: userId });
    // Calculate number of favorited recipes
    const favoritesCount = user.favorites?.length || 0;

    // Return user object with stats attached
    return {
      ...user.toObject(), // Spread user document fields
      stats: {
        recipes: recipesCount, // Total recipes created
        favorites: favoritesCount, // Total favorite recipes
        joined: user.createdAt, // Account creation date
      },
    };
  }

  /**
   * FUNCTION: Update user profile
   * Allows updating profile fields: name, bio, profilePicture, location
   * Prevents updating: email, password, role, timestamps
   * @param {String} userId - User's MongoDB ID
   * @param {Object} updateData - Fields to update
   * @param {String} updateData.name - User's display name
   * @param {String} updateData.bio - User's biography
   * @param {String} updateData.profilePicture - Profile photo URL
   * @param {String} updateData.location - User's location
   * @returns {Object} Updated User document (without password)
   * @throws {Error} If user not found
   */
  async updateProfile(userId, updateData) {
    // ========== PREVENT SENSITIVE FIELD UPDATES ==========
    // Security: Remove fields that should never be updated by user
    delete updateData.email; // Email shouldn't change (for account recovery)
    delete updateData.password; // Password updated via separate route
    delete updateData.role; // Role/permissions cannot be self-changed
    delete updateData.createdAt; // Account creation date is immutable

    // ========== WHITELIST ALLOWED FIELDS ==========
    // Only these fields are safe to update by the user
    const allowedFields = ["name", "bio", "profilePicture", "location"];
    const filteredData = {};

    // Copy only allowed fields from updateData to filteredData
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // ========== UPDATE DATABASE ==========
    // findByIdAndUpdate: Find user and update fields atomically
    // runValidators: true - Run Mongoose schema validations on updates
    // new: true - Return updated document, not original
    const user = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    }).select("-password"); // Exclude password from response

    // If user doesn't exist, throw NotFound error (404)
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    return user;
  }

  // ========== FAVORITES MANAGEMENT ==========
  // Add, remove, and retrieve favorite recipes

  /**
   * FUNCTION: Get user's favorite recipes
   * Fetches all recipes user marked as favorites with full details
   * @param {String} userId - User's MongoDB ID
   * @returns {Array} Array of Recipe documents with user info
   * @throws {Error} If user not found
   */
  async getFavorites(userId) {
    // Find user and populate favorites with nested data
    // Nested populate: recipes → their creator's name
    const user = await User.findById(userId).populate({
      path: "favorites", // Replace favorite IDs with full recipe objects
      select: "title description category state image user", // Which recipe fields to include
      populate: {
        path: "user", // Populate recipe's creator
        select: "name", // Only get creator's name
      },
    });

    // If user doesn't exist, throw NotFound error (404)
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Return favorites array (or empty array if no favorites)
    return user.favorites || [];
  }

  /**
   * FUNCTION: Add recipe to user's favorites
   * Adds recipe to user's favorites array (prevents duplicates)
   * @param {String} userId - User's MongoDB ID
   * @param {String} recipeId - Recipe MongoDB ID to add
   * @returns {Object} {message: "Added to favorites"}
   * @throws {Error} If recipe/user not found or already favorited
   */
  async addFavorite(userId, recipeId) {
    // ========== VERIFY RECIPE EXISTS ==========
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw AppError.notFound("Recipe not found", "RECIPE_NOT_FOUND", {
        recipeId,
      });
    }

    // ========== VERIFY USER EXISTS ==========
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== CHECK IF ALREADY FAVORITED ==========
    // Prevent duplicate favorites (check if recipe ID already in favorites array)
    if (user.favorites.includes(recipeId)) {
      throw AppError.conflict(
        "Recipe is already in favorites",
        "ALREADY_FAVORITED",
        { recipeId },
      );
    }

    // ========== ADD TO FAVORITES ==========
    user.favorites.push(recipeId); // Add recipe ID to favorites array
    await user.save(); // Save changes to database

    return { message: "Added to favorites" };
  }

  /**
   * FUNCTION: Remove recipe from user's favorites
   * Removes recipe from user's favorites array
   * @param {String} userId - User's MongoDB ID
   * @param {String} recipeId - Recipe MongoDB ID to remove
   * @returns {Object} {message: "Removed from favorites"}
   * @throws {Error} If user not found or recipe not in favorites
   */
  async removeFavorite(userId, recipeId) {
    // ========== FIND USER ==========
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== VERIFY IN FAVORITES ==========
    // Check if recipe ID is in favorites array
    if (!user.favorites.includes(recipeId)) {
      throw AppError.badRequest("Recipe is not in favorites", "NOT_FAVORITED", {
        recipeId,
      });
    }

    // ========== REMOVE FROM FAVORITES ==========
    // Filter out the recipe ID, keep all others
    user.favorites = user.favorites.filter((id) => id.toString() !== recipeId);
    await user.save(); // Save changes to database

    return { message: "Removed from favorites" };
  }

  /**
   * FUNCTION: Check if recipe is favorited
   * Determines if user has marked recipe as favorite
   * @param {String} userId - User's MongoDB ID
   * @param {String} recipeId - Recipe MongoDB ID
   * @returns {Boolean} True if in favorites, false otherwise
   * @throws {Error} If user not found
   */
  async isFavorited(userId, recipeId) {
    // ========== FIND USER ==========
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // Return whether recipe ID is in favorites array
    return user.favorites.includes(recipeId);
  }

  // ========== RECIPE MANAGEMENT ==========
  // Get user's created recipes with pagination

  /**
   * FUNCTION: Get user's recipes with pagination
   * Fetches all recipes created by user with pagination support
   * @param {String} userId - User's MongoDB ID
   * @param {Number} page - Page number (default: 1)
   * @param {Number} limit - Results per page (default: 10)
   * @returns {Object} {
   *   data: recipes[],
   *   pagination: {total, page, limit, pages, hasNext, hasPrev}
   * }
   * @throws {Error} If user not found
   */
  async getUserRecipes(userId, page = 1, limit = 10) {
    // ========== VERIFY USER EXISTS ==========
    const user = await User.findById(userId).select("_id");
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== CALCULATE PAGINATION ==========
    // skip: Number of documents to skip (e.g., page 2, limit 10 → skip 10)
    const skip = (page - 1) * limit;

    // ========== FETCH RECIPES & TOTAL COUNT ==========
    // Parallel queries: get recipes AND total count at same time
    const [recipes, total] = await Promise.all([
      Recipe.find({ user: userId }) // Find recipes created by this user
        .populate("user", "name") // Get creator's name
        .skip(skip) // Skip previous pages' results
        .limit(limit) // Return only 'limit' results
        .sort({ createdAt: -1 }), // Sort by newest first

      Recipe.countDocuments({ user: userId }), // Count total user recipes
    ]);

    // ========== BUILD RESPONSE ==========
    return {
      data: recipes, // Array of recipe documents
      pagination: {
        total, // Total recipes by user
        page, // Current page
        limit, // Results per page
        pages: Math.ceil(total / limit), // Total number of pages
        hasNext: page < Math.ceil(total / limit), // Is there a next page?
        hasPrev: page > 1, // Is there a previous page?
      },
    };
  }

  // ========== ADMIN OPERATIONS ==========
  // User listing, searching, and account deletion

  /**
   * FUNCTION: Get all users list with pagination (admin only)
   * Fetches all users with pagination for admin dashboard
   * @param {Number} page - Page number (default: 1)
   * @param {Number} limit - Results per page (default: 10)
   * @returns {Object} {
   *   data: users[],
   *   pagination: {total, page, limit, pages}
   * }
   * @throws {Error} If page/limit invalid
   */
  async getUsers(page = 1, limit = 10) {
    // ========== VALIDATE PAGINATION PARAMS ==========
    // Both page and limit must be positive numbers
    if (page < 1 || limit < 1) {
      throw AppError.badRequest(
        "Page and limit must be greater than 0",
        "INVALID_PAGINATION",
        { page, limit },
      );
    }

    // ========== CALCULATE PAGINATION ==========
    const skip = (page - 1) * limit;

    // ========== FETCH USERS & TOTAL COUNT ==========
    // Parallel queries: get users AND total count
    const [users, total] = await Promise.all([
      User.find() // Find all users
        .select("-password") // Exclude passwords (security)
        .skip(skip) // Skip previous pages' results
        .limit(limit) // Return only 'limit' results
        .sort({ createdAt: -1 }), // Sort by newest first

      User.countDocuments(), // Count total users in database
    ]);

    // ========== BUILD RESPONSE ==========
    return {
      data: users, // Array of user documents
      pagination: {
        total, // Total users
        page, // Current page
        limit, // Results per page
        pages: Math.ceil(total / limit), // Total number of pages
      },
    };
  }

  /**
   * FUNCTION: Search users by name or email
   * Case-insensitive search in user names and emails
   * @param {String} query - Search term
   * @returns {Array} Array of up to 10 matching User documents
   * @throws {Error} If search query empty
   */
  async searchUsers(query) {
    // ========== VALIDATE SEARCH QUERY ==========
    // Query must exist and have content after trimming whitespace
    if (!query || query.trim().length === 0) {
      throw AppError.badRequest("Search query is required", "EMPTY_QUERY", {
        minLength: 1,
      });
    }

    // ========== PERFORM SEARCH ==========
    // Find users where name OR email CONTAINS search term (case-insensitive)
    // $or: Match if EITHER condition is true
    // $regex: Pattern matching on string
    // $options: "i" = case-insensitive
    return await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } }, // Search in name
        { email: { $regex: query, $options: "i" } }, // Search in email
      ],
    })
      .select("-password") // Don't return passwords
      .limit(10); // Limit to 10 results to prevent data overload
  }

  // ========== ACCOUNT OPERATIONS ==========
  // Delete user accounts and associated data

  /**
   * FUNCTION: Delete user account permanently
   * Removes user document and all recipes created by user
   * @param {String} userId - User's MongoDB ID
   * @returns {Object} {message: "Account deleted successfully"}
   * @throws {Error} If user not found
   */
  async deleteAccount(userId) {
    // ========== FIND USER ==========
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND", { userId });
    }

    // ========== DELETE USER'S RECIPES ==========
    // Remove all recipes created by user (optional - prevents orphaned data)
    // deleteMany: Delete all matching documents
    await Recipe.deleteMany({ user: userId });

    // ========== DELETE USER ACCOUNT ==========
    // Remove user from database permanently
    await User.findByIdAndDelete(userId);

    // Return success message
    return { message: "Account deleted successfully" };
  }
}

// ========== SINGLETON EXPORT ==========
// Export single instance of UserService for use throughout backend
// Usage: const service = require('./userService'); service.getUserProfile(userId)
module.exports = new UserService();
