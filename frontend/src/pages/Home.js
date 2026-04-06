import React, { useContext } from "react";
import { RecipeContext } from "../context/RecipeContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import RecipeCard from "../components/recipe/RecipeCard";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import { ChefHat, Clock, BookOpen, Users } from "lucide-react";

const Home = () => {
  const { recipes = [], loading, error } = useContext(RecipeContext);

  const categories = [
    { name: "Indian", emoji: "🇮🇳", count: 245 },
    { name: "Italian", emoji: "🇮🇹", count: 156 },
    { name: "Mexican", emoji: "🌮", count: 124 },
    { name: "Asian", emoji: "🥢", count: 198 },
  ];

  const stats = [
    { icon: ChefHat, label: "Recipes", value: "5000+" },
    { icon: Users, label: "Users", value: "10K+" },
    { icon: BookOpen, label: "Cuisines", value: "50+" },
    { icon: Clock, label: "Saved", value: "25K+" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* ========== HERO SECTION ========== */}
      <div
        className="relative h-screen bg-cover bg-center flex items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage:
            "url('https://d1tgh8fmlzexmh.cloudfront.net/ccbp-responsive-website/foodmunch-banner-bg.png')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto px-4 z-10"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 font-display">
            Spice Scoop
          </h1>
          <p className="text-2xl md:text-3xl text-gray-100 mb-8 font-light">
            Discover Authentic Recipes from Around the World
          </p>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
            Share, explore, and master culinary traditions from every corner of
            India
          </p>

          <div className="flex gap-4 justify-center flex-wrap flex-col sm:flex-row">
            <Link
              to="/search"
              className="px-8 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition transform hover:scale-105"
            >
              🔍 Explore Recipes
            </Link>
            <Link
              to="/upload"
              className="px-8 py-3 bg-white/20 text-white rounded-lg font-semibold border-2 border-white hover:bg-white/30 transition"
            >
              📝 Share Your Recipe
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ========== STATISTICS SECTION ========== */}
      <section className="py-16 bg-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center"
                >
                  <Icon size={40} className="mx-auto mb-3 text-secondary-500" />
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                  <p className="text-gray-100">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== CATEGORIES SECTION ========== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              🌍 Popular Categories
            </h2>
            <p className="text-lg text-neutral-600">
              Explore recipes from different cuisines around the world
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={`/category/${cat.name}`}>
                  <div className="card p-8 text-center cursor-pointer">
                    <div className="text-6xl mb-3">{cat.emoji}</div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {cat.count} recipes
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED RECIPES SECTION ========== */}
      <section className="py-20 px-4 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              🍴 Featured Recipes
            </h2>
            <p className="text-lg text-neutral-600">
              Check out our latest and most popular recipes
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="card h-80">
                    <LoadingSkeleton count={1} type="card" />
                  </div>
                ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center">
              <p className="text-lg font-semibold">⚠️ Error loading recipes</p>
              <p>{error}</p>
            </div>
          )}

          {/* Recipes Grid */}
          {!loading && !error && recipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.slice(0, 6).map((recipe, idx) => (
                <motion.div
                  key={recipe._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <RecipeCard recipe={recipe} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && recipes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-2xl text-neutral-600 mb-4">
                📭 No recipes found
              </p>
              <Link
                to="/upload"
                className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Be the first to share! 🍳
              </Link>
            </div>
          )}

          {/* View All Button */}
          {recipes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-center mt-12"
            >
              <Link
                to="/search"
                className="inline-block px-8 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition transform hover:scale-105"
              >
                View All Recipes →
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Share Your Culinary Masterpiece?
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Join thousands of food enthusiasts and share your favorite recipes
            with the world
          </p>
          <Link
            to="/upload"
            className="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg font-bold hover:bg-gray-100 transition transform hover:scale-105"
          >
            Upload Your Recipe Now 🚀
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
