import React, { useContext, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { RecipeContext } from "../context/RecipeContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Trash2, Eye, Plus, User, Mail } from "lucide-react";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import Button from "../components/ui/Button";

const Profile = () => {
  const { user, token, logout } = useAuth();
  const { recipes, fetchUserRecipes } = useContext(RecipeContext);
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  useEffect(() => {
    if (token) {
      fetchUserRecipes();
    }
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

  const handleDeleteRecipe = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/recipes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      fetchUserRecipes();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-12">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <motion.div whileHover={{ scale: 1.05 }} className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-white/10 border-4 border-white/30 flex items-center justify-center overflow-hidden">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/013/042/571/large_2x/default-avatar-profile-icon-social-media-user-photo-in-flat-style-vector.jpg"
                  alt="User Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </motion.div>

            {/* User Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {user.name}
              </h1>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 text-white/80">
                <div className="flex items-center gap-2">
                  <Mail size={18} />
                  <span>{user.email}</span>
                </div>
              </div>
              <p className="text-white/60 mt-3">
                👨‍🍳 Home Chef • Recipe Creator
              </p>
            </div>

            {/* Logout Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                <LogOut size={20} />
                Logout
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="card p-6">
            <p className="text-neutral-600 text-sm mb-2">📝 Recipes Created</p>
            <p className="text-4xl font-bold text-primary-600">
              {recipes.length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-neutral-600 text-sm mb-2">⭐ Created At</p>
            <p className="text-xl font-semibold text-neutral-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-neutral-600 text-sm mb-2">🎯 Status</p>
            <p className="text-lg font-semibold text-green-600">Active Chef</p>
          </div>
        </motion.div>

        {/* Your Recipes Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-neutral-900">
              🍳 Your Recipes
            </h2>
            <Button onClick={() => navigate("/upload")}>
              <Plus size={20} />
              New Recipe
            </Button>
          </div>

          {recipes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-neutral-50 rounded-xl"
            >
              <User className="mx-auto mb-4 text-neutral-400" size={48} />
              <p className="text-lg text-neutral-600 font-semibold mb-2">
                No recipes yet
              </p>
              <p className="text-neutral-500 mb-6">
                Start creating your first recipe to share with the community
              </p>
              <Button onClick={() => navigate("/upload")}>
                <Plus size={20} />
                Create First Recipe
              </Button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {recipes.map((recipe, idx) => (
                  <motion.div
                    key={recipe._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: idx * 0.1 }}
                    className="card overflow-hidden hover:shadow-xl transition group"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-neutral-200">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/recipe/${recipe._id}`)}
                            className="bg-white text-primary-600 p-3 rounded-full font-bold hover:bg-primary-600 hover:text-white transition"
                          >
                            <Eye size={20} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteConfirm(recipe._id)}
                            className="bg-red-500 text-white p-3 rounded-full font-bold hover:bg-red-600 transition"
                          >
                            <Trash2 size={20} />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-bold text-neutral-900 mb-2 line-clamp-2">
                        {recipe.title}
                      </h3>
                      <p className="text-neutral-600 text-sm line-clamp-2 mb-4">
                        {recipe.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex gap-2 mb-4 text-xs text-neutral-600">
                        {recipe.category && (
                          <span className="badge">{recipe.category}</span>
                        )}
                        {recipe.difficulty && (
                          <span className="badge">{recipe.difficulty}</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/recipe/${recipe._id}`)}
                          className="flex-1 btn-primary py-2 px-3 text-sm"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(recipe._id)}
                          className="flex-1 btn-outline py-2 px-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-sm"
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-3">
                Delete Recipe?
              </h3>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete this recipe? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 btn-outline py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRecipe(deleteConfirm)}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
