import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import RecipeCard from "../components/recipe/RecipeCard";
import { Button, LoadingSkeleton, EmptyState } from "../components/ui";

const CategoryPage = () => {
  const { category } = useParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/recipes/category/${category}`);
        setRecipes(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [category]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white/70 hover:text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft size={18} /> Back
          </Button>
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">🍽️ {category} Recipes</h1>
            <p className="text-white/70 text-lg">Explore delicious {category?.toLowerCase()} dishes</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <LoadingSkeleton key={i} />)}
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No recipes found"
            description={`Be the first to add a ${category?.toLowerCase()} recipe`}
            actionTo="/upload"
            actionLabel="Add Recipe"
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {recipes.map((recipe, idx) => (
                <motion.div
                  key={recipe._id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
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
