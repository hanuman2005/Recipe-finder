import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Plus } from "lucide-react";
import { Button, Input, Select, Textarea, Alert, Card } from "../components/ui";
import EquipmentSelector from "../components/filters/EquipmentSelector";

const CATEGORIES = ["Italian", "Mexican", "Asian", "Indian", "Mediterranean", "Vegan", "Dessert", "Other"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

const SectionTitle = ({ emoji, title }) => (
  <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
    <span>{emoji}</span> {title}
  </h2>
);

const UploadRecipe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState({
    title: "", description: "", image: "", ingredients: [],
    steps: [], equipment: [], category: "", state: "",
    prepTime: 0, cookTime: 0, difficulty: "Medium", benefits: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (name, value) => setRecipe((r) => ({ ...r, [name]: value }));
  const handleChange = (e) => {
    setError("");
    set(e.target.name, e.target.value);
  };

  const addIngredient = () =>
    set("ingredients", [...recipe.ingredients, { name: "", quantity: "", unit: "" }]);

  const updateIngredient = (idx, field, value) => {
    const updated = [...recipe.ingredients];
    updated[idx][field] = value;
    set("ingredients", updated);
  };

  const removeIngredient = (idx) =>
    set("ingredients", recipe.ingredients.filter((_, i) => i !== idx));

  const addStep = () =>
    set("steps", [...recipe.steps, { stepNumber: recipe.steps.length + 1, description: "" }]);

  const updateStep = (idx, value) => {
    const updated = [...recipe.steps];
    updated[idx].description = value;
    set("steps", updated);
  };

  const removeStep = (idx) =>
    set("steps", recipe.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })));

  const validate = () => {
    if (!recipe.title.trim()) return "Title is required";
    if (!recipe.description.trim()) return "Description is required";
    if (!recipe.image.trim()) return "Image URL is required";
    if (recipe.ingredients.length === 0) return "Add at least one ingredient";
    if (recipe.steps.length === 0) return "Add at least one step";
    if (!recipe.category) return "Category is required";
    if (!recipe.state) return "State/Region is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!user) { setError("You must be logged in to add a recipe"); return; }
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(recipe),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload recipe");
      setSuccess("Recipe uploaded successfully! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">🍳 Upload Your Recipe</h1>
          <p className="text-neutral-500">Share your culinary masterpiece with the community</p>
        </div>

        {error && <Alert type="error" message={error} onDismiss={() => setError("")} className="mb-6" />}
        {success && <Alert type="success" message={success} className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-1">
          {/* Basic Info */}
          <Card padding="lg" className="rounded-b-none">
            <SectionTitle emoji="📝" title="Basic Information" />
            <div className="space-y-5">
              <Input
                label="Recipe Title"
                name="title"
                placeholder="e.g., Homemade Pasta Carbonara"
                value={recipe.title}
                onChange={handleChange}
                required
              />
              <Textarea
                label="Description"
                name="description"
                placeholder="Describe your recipe, its origin, and why it's special..."
                value={recipe.description}
                onChange={handleChange}
                rows={4}
                required
              />
              <div>
                <Input
                  label="Image URL"
                  name="image"
                  placeholder="https://example.com/recipe.jpg"
                  value={recipe.image}
                  onChange={handleChange}
                  required
                />
                <AnimatePresence>
                  {recipe.image && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 rounded-lg overflow-hidden bg-neutral-100 h-44 flex items-center justify-center"
                    >
                      <img
                        src={recipe.image}
                        alt="Preview"
                        className="max-h-full w-full object-cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>

          {/* Details */}
          <Card padding="lg" className="rounded-none">
            <SectionTitle emoji="🏷️" title="Recipe Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select
                label="Category"
                name="category"
                value={recipe.category}
                onChange={handleChange}
                placeholder="Select a category"
                options={CATEGORIES}
                required
              />
              <Input
                label="State / Region"
                name="state"
                placeholder="e.g., Tamil Nadu"
                value={recipe.state}
                onChange={handleChange}
                required
              />
              <Input
                label="Prep Time (minutes)"
                name="prepTime"
                type="number"
                value={recipe.prepTime}
                onChange={handleChange}
              />
              <Input
                label="Cook Time (minutes)"
                name="cookTime"
                type="number"
                value={recipe.cookTime}
                onChange={handleChange}
              />
              <Select
                label="Difficulty"
                name="difficulty"
                value={recipe.difficulty}
                onChange={handleChange}
                options={DIFFICULTIES}
              />
              <Input
                label="Health Benefits"
                name="benefits"
                placeholder="e.g., Rich in protein, low carb"
                value={recipe.benefits}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* Equipment */}
          <Card padding="lg" className="rounded-none">
            <SectionTitle emoji="⚡" title="Equipment Used" />
            <EquipmentSelector
              value={recipe.equipment}
              onChange={(eq) => set("equipment", eq)}
            />
          </Card>

          {/* Ingredients */}
          <Card padding="lg" className="rounded-none">
            <SectionTitle emoji="🥘" title="Ingredients" />
            <div className="space-y-3">
              <AnimatePresence>
                {recipe.ingredients.map((ing, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Qty"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-300 hover:bg-red-50 px-2.5"
                        onClick={() => removeIngredient(idx)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-4 w-full py-2.5 border-2 border-dashed border-primary-300 text-primary-600 rounded-lg text-sm font-semibold hover:bg-primary-50 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Ingredient
            </button>
          </Card>

          {/* Steps */}
          <Card padding="lg" className="rounded-none">
            <SectionTitle emoji="👣" title="Cooking Steps" />
            <div className="space-y-3">
              <AnimatePresence>
                {recipe.steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="flex gap-3 items-center"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.stepNumber}
                    </div>
                    <input
                      type="text"
                      placeholder="Describe this cooking step..."
                      value={step.description}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-300 hover:bg-red-50 px-2.5 flex-shrink-0"
                      onClick={() => removeStep(idx)}
                    >
                      <X size={14} />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-4 w-full py-2.5 border-2 border-dashed border-primary-300 text-primary-600 rounded-lg text-sm font-semibold hover:bg-primary-50 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Step
            </button>
          </Card>

          {/* Submit */}
          <Card padding="lg" className="rounded-t-none bg-neutral-50">
            <div className="flex gap-3">
              <Button type="submit" loading={loading} size="lg" className="flex-1">
                <Upload size={18} />
                {loading ? "Uploading..." : "Upload Recipe"}
              </Button>
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </Card>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadRecipe;
