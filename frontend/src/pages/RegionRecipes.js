import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowLeft } from "lucide-react";
import RecipeCard from "../components/recipe/RecipeCard";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";

const RegionRecipes = () => {
  const { state } = useParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) return;

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setRecipes([]);
        setError(null);

        const response = await fetch(
          `http://localhost:5000/api/recipes/state/${encodeURIComponent(state)}`
        );

        if (!response.ok) {
          throw new Error("No recipes found for this region.");
        }

        const data = await response.json();
        const recipesArray = data.data || (Array.isArray(data) ? data : []);
        setRecipes(Array.isArray(recipesArray) ? recipesArray : []);
      } catch (error) {
        setError(error.message);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-600 to-accent-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-6 text-white/70 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back
          </motion.button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-2">
              <MapPin size={40} />
              {state}
            </h1>
            <p className="text-white/80 text-lg">
              Discover regional recipes from {state}
            </p>
          </motion.div>
        </div>
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
          </motion.div>
        ) : recipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-neutral-50 rounded-xl"
          >
            <p className="text-lg text-neutral-600 font-semibold">No recipes found</p>
            <p className="text-neutral-500 mt-2">
              Be the first to add a recipe from {state}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {Array.isArray(recipes) &&
                recipes.map((recipe, idx) => (
                  <motion.div
                    key={recipe._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <RecipeCard recipe={recipe} />
                  </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RegionRecipes;
