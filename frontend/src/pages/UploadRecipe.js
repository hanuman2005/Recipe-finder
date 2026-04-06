import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import EquipmentSelector from "../components/filters/EquipmentSelector";
import { motion } from "framer-motion";
import { Upload, AlertCircle, CheckCircle, X } from "lucide-react";

const UploadRecipe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState({
    title: "",
    description: "",
    image: "",
    ingredients: [],
    steps: [],
    equipment: [],
    category: "",
    state: "",
    prepTime: 0,
    cookTime: 0,
    difficulty: "Medium",
    benefits: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipe({ ...recipe, [name]: value });
  };

  const handleIngredientAdd = () => {
    setRecipe({
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        { name: "", quantity: "", unit: "" },
      ],
    });
  };

  const handleStepAdd = () => {
    setRecipe({
      ...recipe,
      steps: [
        ...recipe.steps,
        { stepNumber: recipe.steps.length + 1, description: "" },
      ],
    });
  };

  const validateForm = () => {
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
    setError("");
    setSuccess("");

    if (!user) {
      setError("You must be logged in to add a recipe!");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(recipe),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload recipe");
      }

      setSuccess("✅ Recipe uploaded successfully! Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-2">
            🍳 Upload Your Recipe
          </h1>
          <p className="text-lg text-neutral-600">
            Share your culinary masterpiece with the community
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3"
          >
            <AlertCircle
              className="text-red-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="flex-1">
              <p className="text-red-700 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-start gap-3"
          >
            <CheckCircle
              className="text-green-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="flex-1">
              <p className="text-green-700 font-semibold">Success</p>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg overflow-hidden divide-y divide-neutral-200"
        >
          {/* Basic Info Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              📝 Basic Information
            </h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Recipe Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Homemade Pasta Carbonara"
                  value={recipe.title}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your recipe, its origin, and why it's special..."
                  value={recipe.description}
                  onChange={handleChange}
                  rows="4"
                  className="input-field resize-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="image"
                  placeholder="https://example.com/recipe.jpg"
                  value={recipe.image}
                  onChange={handleChange}
                  className="input-field"
                />
                {recipe.image && (
                  <div className="mt-4 rounded-lg overflow-hidden bg-neutral-100 h-48 flex items-center justify-center">
                    <img
                      src={recipe.image}
                      alt="Recipe preview"
                      className="max-h-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recipe Details Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              🏷️ Recipe Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={recipe.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  <option value="Italian">Italian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Asian">Asian</option>
                  <option value="Indian">Indian</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  State/Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  placeholder="e.g., Tamil Nadu"
                  value={recipe.state}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Prep Time */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  name="prepTime"
                  value={recipe.prepTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Cook Time */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  name="cookTime"
                  value={recipe.cookTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={recipe.difficulty}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Health Benefits
                </label>
                <input
                  type="text"
                  name="benefits"
                  placeholder="e.g., Rich in protein, low carb"
                  value={recipe.benefits}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Equipment Section (Feature #3) */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              ⚡ Equipment Used
            </h2>
            <EquipmentSelector
              value={recipe.equipment}
              onChange={(eq) => setRecipe({ ...recipe, equipment: eq })}
            />
          </div>

          {/* Ingredients Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              🥘 Ingredients
            </h2>

            <div className="space-y-4">
              {recipe.ingredients.map((ing, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-12 gap-3 items-end"
                >
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ing.name}
                    onChange={(e) => {
                      const newIngs = [...recipe.ingredients];
                      newIngs[idx].name = e.target.value;
                      setRecipe({ ...recipe, ingredients: newIngs });
                    }}
                    className="input-field col-span-6"
                  />
                  <input
                    type="text"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const newIngs = [...recipe.ingredients];
                      newIngs[idx].quantity = e.target.value;
                      setRecipe({ ...recipe, ingredients: newIngs });
                    }}
                    className="input-field col-span-3"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => {
                      const newIngs = [...recipe.ingredients];
                      newIngs[idx].unit = e.target.value;
                      setRecipe({ ...recipe, ingredients: newIngs });
                    }}
                    className="input-field col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newIngs = recipe.ingredients.filter(
                        (_, i) => i !== idx,
                      );
                      setRecipe({ ...recipe, ingredients: newIngs });
                    }}
                    className="btn-outline px-3 py-2 text-red-600 hover:bg-red-50 col-span-1"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleIngredientAdd}
              className="mt-6 w-full py-2 border-2 border-dashed border-primary-300 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition"
            >
              + Add Ingredient
            </button>
          </div>

          {/* Steps Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              👣 Cooking Steps
            </h2>

            <div className="space-y-4">
              {recipe.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                    {step.stepNumber}
                  </div>
                  <input
                    type="text"
                    placeholder="Describe this step..."
                    value={step.description}
                    onChange={(e) => {
                      const newSteps = [...recipe.steps];
                      newSteps[idx].description = e.target.value;
                      setRecipe({ ...recipe, steps: newSteps });
                    }}
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newSteps = recipe.steps.filter((_, i) => i !== idx);
                      setRecipe({ ...recipe, steps: newSteps });
                    }}
                    className="btn-outline px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStepAdd}
              className="mt-6 w-full py-2 border-2 border-dashed border-primary-300 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition"
            >
              + Add Step
            </button>
          </div>

          {/* Submit Section */}
          <div className="p-8 bg-neutral-50 flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="flex-1"
              size="lg"
            >
              <Upload size={20} />
              {loading ? "Uploading..." : "Upload Recipe"}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 btn-outline py-3 px-6 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadRecipe;
