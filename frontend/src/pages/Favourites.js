import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import Button from "../components/ui/Button";
import RecipeCard from "../components/recipe/RecipeCard";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";

const Favourites = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchFavorites();
  }, [token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }

      const data = await response.json();
      setFavorites(data || []);
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
      const response = await fetch(
        `http://localhost:5000/api/favorites/${recipeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove favorite");
      }

      setFavorites(favorites.filter((fav) => fav._id !== recipeId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 text-white/70 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="fill-current" size={40} />
            <h1 className="text-4xl md:text-5xl font-bold">My Favourites</h1>
          </div>
          <p className="text-white/80 text-lg">
            {favorites.length} recipe{favorites.length !== 1 ? "s" : ""} saved
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-red-50 rounded-xl border border-red-200"
          >
            <p className="text-lg text-red-700 font-semibold">{error}</p>
            <Button onClick={fetchFavorites} className="mt-4">
              Retry
            </Button>
          </motion.div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-neutral-50 rounded-xl"
          >
            <Heart className="mx-auto mb-4 text-neutral-400" size={48} />
            <p className="text-lg text-neutral-600 font-semibold mb-2">
              No favorites yet
            </p>
            <p className="text-neutral-500 mb-6">
              Save recipes to your favorites to access them later
            </p>
            <Button onClick={() => navigate("/search")}>Browse Recipes</Button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {favorites.map((recipe, idx) => (
                <motion.div
                  key={recipe._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <RecipeCard recipe={recipe} />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeFavorite(recipe._id)}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full z-10 transition shadow-lg"
                  >
                    <Trash2 size={18} />
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
