import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import { Button, LoadingSkeleton, EmptyState, Alert } from "../components/ui";
import RecipeCard from "../components/recipe/RecipeCard";

const Favourites = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchFavorites();
  }, [token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch favorites");
      setFavorites((await res.json()) || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (recipeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/favorites/${recipeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to remove favorite");
      setFavorites((prev) => prev.filter((f) => f._id !== recipeId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white/70 hover:text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft size={18} />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-1">
            <Heart size={36} className="fill-current" />
            <h1 className="text-4xl md:text-5xl font-bold">My Favourites</h1>
          </div>
          <p className="text-white/70 mt-2">
            {favorites.length} recipe{favorites.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <LoadingSkeleton key={i} />)}
          </div>
        )}

        {error && !loading && (
          <Alert
            type="error"
            message={error}
            className="mb-6"
          />
        )}

        {!loading && !error && favorites.length === 0 && (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Save recipes you love to access them here anytime"
            actionTo="/search"
            actionLabel="Browse Recipes"
          />
        )}

        {!loading && favorites.length > 0 && (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {favorites.map((recipe, idx) => (
                <motion.div
                  key={recipe._id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ delay: idx * 0.08 }}
                  className="relative"
                >
                  <RecipeCard recipe={recipe} />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFavorite(recipe._id)}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full z-10 shadow-lg transition"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Favourites;
