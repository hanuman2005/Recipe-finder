import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter } from "lucide-react";
import RecipeCard from "../components/recipe/RecipeCard";
import EquipmentFilter from "../components/filters/EquipmentFilter";
import { Button, Input, LoadingSkeleton, EmptyState, Alert, Card } from "../components/ui";
import { useFilterStore } from "../store/filterStore";

const SearchResults = () => {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const { selectedEquipment, maxPrepTime, maxCookTime } = useFilterStore();

  useEffect(() => {
    if (!query.trim()) { setRecipes([]); setFilteredRecipes([]); return; }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `http://localhost:5000/api/recipes/search?title=${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error("No recipes found");
        setRecipes(await res.json());
      } catch (err) {
        setError(err.message);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let filtered = recipes;
    if (selectedEquipment.length > 0) {
      filtered = filtered.filter((r) =>
        selectedEquipment.some((eq) =>
          (r.equipment || []).some((re) => re.toLowerCase().includes(eq.toLowerCase()))
        )
      );
    }
    if (maxPrepTime > 0) filtered = filtered.filter((r) => (r.prepTime || 0) <= maxPrepTime);
    if (maxCookTime > 0) filtered = filtered.filter((r) => (r.cookTime || 0) <= maxCookTime);
    setFilteredRecipes(filtered);
  }, [recipes, selectedEquipment, maxPrepTime, maxCookTime]);

  const displayed = filteredRecipes.length > 0 ? filteredRecipes : recipes;
  const activeFilters = [
    selectedEquipment.length > 0 && `${selectedEquipment.length} equipment`,
    maxPrepTime > 0 && `prep ≤${maxPrepTime}m`,
    maxCookTime > 0 && `cook ≤${maxCookTime}m`,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">🔍 Find Recipes</h1>
          <Input
            type="text"
            placeholder="Search recipes by title, ingredients, or cuisine..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={Search}
            variant="glass"
            className="text-lg py-4"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <Button
              variant="primary"
              fullWidth
              className="lg:hidden mb-4"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <AnimatePresence>
              {(showFilters || true) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="hidden lg:block"
                >
                  <Card padding="md">
                    <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      ⚡ Equipment Filter
                    </h3>
                    <EquipmentFilter />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            {showFilters && (
              <Card padding="md" className="lg:hidden">
                <h3 className="text-base font-bold text-neutral-900 mb-4">⚡ Equipment Filter</h3>
                <EquipmentFilter />
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Active search tags */}
            {query && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-neutral-500">
                  Searching: <strong className="text-neutral-800">"{query}"</strong>
                </span>
                {activeFilters.map((f) => (
                  <span key={f} className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-medium">
                    {f}
                  </span>
                ))}
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => <LoadingSkeleton key={i} />)}
              </div>
            )}

            {error && !loading && (
              <Alert type="error" message="No recipes found matching your search." className="mb-6" />
            )}

            {!query && !loading && (
              <EmptyState
                icon={Search}
                title="Start searching"
                description="Enter a recipe name or ingredient to get started"
              />
            )}

            {!loading && displayed.length > 0 && (
              <>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {displayed.map((recipe, idx) => (
                      <motion.div
                        key={recipe._id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ delay: idx * 0.06 }}
                      >
                        <RecipeCard recipe={recipe} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
                <p className="text-center text-neutral-400 text-sm mt-8">
                  {displayed.length} recipe{displayed.length !== 1 ? "s" : ""} found
                  {recipes.length > displayed.length && ` · ${recipes.length - displayed.length} hidden by filters`}
                </p>
              </>
            )}

            {!loading && query && displayed.length === 0 && recipes.length > 0 && (
              <EmptyState
                emoji="🔎"
                title="No recipes match your filters"
                description="Try adjusting your equipment filter or time limits"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
