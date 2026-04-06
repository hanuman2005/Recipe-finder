import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import RecipeCard from "../components/recipe/RecipeCard";
import EquipmentFilter from "../components/filters/EquipmentFilter";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import { useFilterStore } from "../store/filterStore";

const SearchResults = () => {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  // Get filters from Zustand store (Feature #3)
  const { selectedEquipment, maxPrepTime, maxCookTime } = useFilterStore();

  useEffect(() => {
    if (query.trim() === "") {
      setRecipes([]);
      setFilteredRecipes([]);
      return;
    }

    // Debounce: wait 500ms after user stops typing
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `http://localhost:5000/api/recipes/search?title=${encodeURIComponent(query)}`,
        );

        if (!response.ok) throw new Error("No recipes found");
        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        setError(err.message);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(timer); // Clean up if component unmounts
  }, [query]);

  // Apply equipment and time filters (Feature #3)
  useEffect(() => {
    let filtered = recipes;

    // Filter by equipment
    if (selectedEquipment.length > 0) {
      filtered = filtered.filter((recipe) => {
        const recipeEquipment = recipe.equipment || [];
        return selectedEquipment.some((eq) =>
          recipeEquipment.some((rEq) =>
            rEq.toLowerCase().includes(eq.toLowerCase()),
          ),
        );
      });
    }

    // Filter by prep time
    if (maxPrepTime > 0) {
      filtered = filtered.filter(
        (recipe) => (recipe.prepTime || 0) <= maxPrepTime,
      );
    }

    // Filter by cook time
    if (maxCookTime > 0) {
      filtered = filtered.filter(
        (recipe) => (recipe.cookTime || 0) <= maxCookTime,
      );
    }

    setFilteredRecipes(filtered);
  }, [recipes, selectedEquipment, maxPrepTime, maxCookTime]);

  const displayedRecipes =
    filteredRecipes.length > 0 ? filteredRecipes : recipes;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-12">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            🔍 Find Recipes
          </h1>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50"
              size={24}
            />
            <input
              type="text"
              placeholder="Search for recipes by title, ingredients, or cuisine..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition text-lg"
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-72"
          >
            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full mb-6 flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              <Filter size={20} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            {/* Filters */}
            <AnimatePresence>
              {(showFilters || window.innerWidth >= 1024) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card p-6 space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      ⚡ Equipment
                    </h3>
                    <EquipmentFilter />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1"
          >
            {/* Search Status */}
            <div className="mb-8">
              {query && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full"
                >
                  <span className="text-sm text-neutral-700">
                    Searching for: <strong>"{query}"</strong>
                  </span>
                  {(selectedEquipment.length > 0 ||
                    maxPrepTime > 0 ||
                    maxCookTime > 0) && (
                    <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full">
                      {[
                        selectedEquipment.length > 0 &&
                          `${selectedEquipment.length} equipment`,
                        maxPrepTime > 0 && `prep ≤${maxPrepTime}m`,
                        maxCookTime > 0 && `cook ≤${maxCookTime}m`,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                </motion.div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <LoadingSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border-l-4 border-red-500 p-6 rounded text-center"
              >
                <p className="text-red-700 font-semibold mb-2">
                  No recipes found
                </p>
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* No Query State */}
            {!query && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Search className="mx-auto mb-4 text-neutral-400" size={48} />
                <p className="text-lg text-neutral-600 font-semibold">
                  Start searching
                </p>
                <p className="text-neutral-500">
                  Enter a recipe name or ingredient to get started
                </p>
              </motion.div>
            )}

            {/* Results Grid */}
            {!loading && displayedRecipes.length > 0 && (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {displayedRecipes.map((recipe, idx) => (
                    <motion.div
                      key={recipe._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <RecipeCard recipe={recipe} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* No Results with Query */}
            {!loading &&
              query &&
              displayedRecipes.length === 0 &&
              recipes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-neutral-50 rounded-lg"
                >
                  <p className="text-neutral-700 font-semibold mb-2">
                    No recipes match your filters
                  </p>
                  <p className="text-neutral-600 text-sm">
                    Try adjusting your filters or search query
                  </p>
                </motion.div>
              )}

            {/* Results Count */}
            {!loading && displayedRecipes.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-neutral-600 text-sm mt-8"
              >
                Found {displayedRecipes.length} recipe
                {displayedRecipes.length !== 1 ? "s" : ""} •{" "}
                {recipes.length > displayedRecipes.length && (
                  <span>
                    {recipes.length - displayedRecipes.length} hidden by filters
                  </span>
                )}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
