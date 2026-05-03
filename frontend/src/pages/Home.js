import React, { useContext } from "react";
import { RecipeContext } from "../context/RecipeContext";
import { motion } from "framer-motion";
import RecipeCard from "../components/recipe/RecipeCard";
import { Button, LoadingSkeleton, EmptyState, SectionHeader, Card } from "../components/ui";
import { ChefHat, Clock, BookOpen, Users, UtensilsCrossed } from "lucide-react";

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

const Home = () => {
  const { recipes = [], loading, error } = useContext(RecipeContext);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">

      {/* HERO */}
      <section
        className="relative h-screen bg-cover bg-center flex items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage:
            "url('https://d1tgh8fmlzexmh.cloudfront.net/ccbp-responsive-website/foodmunch-banner-bg.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto px-4"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 font-display tracking-tight">
            Spice Scoop
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-4 font-light">
            Discover Authentic Recipes from Around the World
          </p>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            Share, explore, and master culinary traditions from every corner of India
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button to="/search" variant="primary" size="xl">
              🔍 Explore Recipes
            </Button>
            <Button to="/upload" variant="white" size="xl">
              📝 Share Your Recipe
            </Button>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
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
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center"
                >
                  <Icon size={40} className="mx-auto mb-3 text-secondary-300" />
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                  <p className="text-white/80 mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            emoji="🌍"
            title="Popular Categories"
            subtitle="Explore recipes from different cuisines around the world"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Card
                  padding="lg"
                  className="text-center cursor-pointer"
                  as="link"
                  onClick={() => (window.location.href = `/category/${cat.name}`)}
                >
                  <div className="text-6xl mb-3">{cat.emoji}</div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">{cat.name}</h3>
                  <p className="text-sm text-neutral-500">{cat.count} recipes</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED RECIPES */}
      <section className="py-20 px-4 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            emoji="🍴"
            title="Featured Recipes"
            subtitle="Check out our latest and most popular recipes"
          />

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md h-80">
                  <LoadingSkeleton count={1} type="card" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <EmptyState
              emoji="⚠️"
              title="Error loading recipes"
              description={error}
            />
          )}

          {!loading && !error && recipes.length === 0 && (
            <EmptyState
              emoji="📭"
              title="No recipes yet"
              description="Be the first to share a recipe with the community!"
              actionTo="/upload"
              actionLabel="Share a Recipe 🍳"
            />
          )}

          {!loading && !error && recipes.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.slice(0, 6).map((recipe, idx) => (
                  <motion.div
                    key={recipe._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <RecipeCard recipe={recipe} />
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-12">
                <Button to="/search" size="lg">
                  View All Recipes →
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-500 to-secondary-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <UtensilsCrossed size={48} className="mx-auto mb-4 text-white/80" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Share Your Culinary Masterpiece?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of food enthusiasts and share your favorite recipes with the world
          </p>
          <Button to="/upload" variant="white" size="xl">
            Upload Your Recipe Now 🚀
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
