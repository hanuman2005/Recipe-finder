import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, ChefHat, Users, ArrowLeft, Heart } from "lucide-react";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import RatingStars from "../components/RatingStars";
import CommentSection from "../components/CommentSection";

const RecipeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/recipes/${id}`);
        if (!response.ok) {
          throw new Error("Recipe not found");
        }
        const data = await response.json();
        const recipeData = data.data || data;
        setRecipe(recipeData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  const servings = recipe.servings || 4;
  const prepTime = recipe.prepTime || 15;
  const cookTime = recipe.cookTime || 30;
  const totalTime = prepTime + cookTime;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-12">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200 py-3">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image */}
            <div className="relative">
              <img
                src={
                  recipe.image ||
                  "https://via.placeholder.com/500x500?text=Recipe"
                }
                alt={recipe.title}
                className="w-full h-96 lg:h-full object-cover rounded-xl shadow-xl"
              />
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur transition ${
                  isFavorited
                    ? "bg-red-500 text-white"
                    : "bg-white/80 text-neutral-700 hover:bg-white"
                }`}
              >
                <Heart size={24} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Info */}
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Category & State Badges */}
                <div className="flex gap-2 mb-4">
                  <span className="badge">
                    {recipe.category || "Uncategorized"}
                  </span>
                  <span className="badge">{recipe.state || "Unknown"}</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                  {recipe.title || "Recipe"}
                </h1>

                {/* Description */}
                <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                  {recipe.description || "No description available"}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg">
                  <div className="text-center">
                    <Clock
                      className="text-primary-600 mx-auto mb-2"
                      size={24}
                    />
                    <p className="text-sm text-neutral-600">Prep Time</p>
                    <p className="font-bold text-neutral-900">{prepTime} min</p>
                  </div>
                  <div className="text-center">
                    <ChefHat
                      className="text-secondary-600 mx-auto mb-2"
                      size={24}
                    />
                    <p className="text-sm text-neutral-600">Cook Time</p>
                    <p className="font-bold text-neutral-900">{cookTime} min</p>
                  </div>
                  <div className="text-center">
                    <Users className="text-accent-600 mx-auto mb-2" size={24} />
                    <p className="text-sm text-neutral-600">Servings</p>
                    <p className="font-bold text-neutral-900">{servings}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="border-t border-b border-neutral-200 py-6">
                  <p className="text-sm text-neutral-600 mb-3">
                    Rate this recipe
                  </p>
                  <RatingStars recipeId={id} />
                </div>

                {/* Difficulty & Benefits */}
                <div className="mt-6 space-y-3">
                  <div>
                    <p className="text-sm text-neutral-600">Difficulty Level</p>
                    <p className="font-semibold text-neutral-900">
                      {recipe.difficulty || "Medium"}
                    </p>
                  </div>
                  {recipe.benefits && (
                    <div>
                      <p className="text-sm text-neutral-600">
                        Health Benefits
                      </p>
                      <p className="font-semibold text-neutral-900">
                        {recipe.benefits}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Equipment Section (Feature #3) */}
          {recipe.equipment && recipe.equipment.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card mb-8"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                ⚡ Equipment Needed
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recipe.equipment.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg text-center"
                  >
                    <p className="font-semibold text-neutral-900">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Ingredients & Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Ingredients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                🥘 Ingredients
              </h3>
              <div className="space-y-2">
                {recipe.ingredients && Array.isArray(recipe.ingredients) ? (
                  recipe.ingredients.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-neutral-700">
                        {typeof item === "object"
                          ? `${item.quantity} ${item.unit} ${item.name}`
                          : item}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-neutral-600">No ingredients listed</p>
                )}
              </div>
            </motion.div>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                👣 Cooking Steps
              </h3>
              <div className="space-y-4">
                {recipe.steps && Array.isArray(recipe.steps) ? (
                  recipe.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <p className="text-neutral-700 pt-1">
                        {typeof step === "object" ? step.description : step}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-neutral-600">No steps listed</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recommended Hotels Section */}
          {recipe.recommendedHotels &&
            Array.isArray(recipe.recommendedHotels) &&
            recipe.recommendedHotels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="card mb-8"
              >
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  🏨 Recommended Restaurants
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recipe.recommendedHotels.map((hotel) => (
                    <div
                      key={hotel._id}
                      className="p-4 border border-neutral-200 rounded-lg hover:shadow-md transition"
                    >
                      <h4 className="font-semibold text-neutral-900 mb-1">
                        {hotel.name}
                      </h4>
                      <p className="text-sm text-neutral-600 mb-2">
                        {hotel.location}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < Math.floor(hotel.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-neutral-300"
                            }
                          />
                        ))}
                        <span className="text-sm text-neutral-600 ml-2">
                          {hotel.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          {/* Comments Section */}
          <CommentSection recipeId={id} />
        </motion.div>
      </div>
    </div>
  );
};

export default RecipeDetails;
