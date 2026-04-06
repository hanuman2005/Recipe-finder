import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import RecipeCard from "../components/recipe/RecipeCard";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";

const CategoryPage = () => {
  const { category } = useParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipesByCategory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/recipes/category/${category}`,
        );
        const data = await response.json();
        setRecipes(data);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipesByCategory();
  }, [category]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12 px-4">
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
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              🍽️ {category} Recipes
            </h1>
            <p className="text-white/80 text-lg">
              Explore delicious {category?.toLowerCase()} dishes
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
        ) : recipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-neutral-50 rounded-xl"
          >
            <p className="text-lg text-neutral-600 font-semibold">
              No recipes found
            </p>
            <p className="text-neutral-500 mt-2">
              Be the first to add a {category?.toLowerCase()} recipe
            </p>
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

export default CategoryPage;
