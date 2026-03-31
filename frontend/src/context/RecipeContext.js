import { createContext, useState, useEffect } from "react";

export const RecipeContext = createContext();

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  // Fetch all recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/recipes");
        if (!response.ok) throw new Error("Failed to fetch recipes");

        const data = await response.json();

        // Handle both response formats
        // Format 1: { success: true, data: [...] }
        // Format 2: [...]
        const recipesArray = data.data || (Array.isArray(data) ? data : []);
        setRecipes(Array.isArray(recipesArray) ? recipesArray : []);
      } catch (err) {
        setError(err.message);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const fetchRecipesByState = async (state) => {
    try {
      setRecipes([]); // Clear old recipes before fetching new ones
      const response = await fetch(
        `http://localhost:5000/api/recipes/${encodeURIComponent(state)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch recipes");
      }

      // Handle both response formats
      const recipesArray = data.data || (Array.isArray(data) ? data : []);
      setRecipes(Array.isArray(recipesArray) ? recipesArray : []);
    } catch (error) {
      console.error("Error fetching recipes:", error.message);
      setRecipes([]); // Ensure no old data is displayed on failure
    }
  };

  // Upload a new recipe
  const addRecipe = async (formData) => {
    try {
      const response = await fetch("http://localhost:5000/api/recipes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const newRecipe = await response.json();
      if (!response.ok)
        throw new Error(newRecipe.message || "Failed to add recipe");

      setRecipes((prevRecipes) => [newRecipe, ...prevRecipes]);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Delete a recipe
  const deleteRecipe = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete recipe");

      setRecipes((prevRecipes) =>
        prevRecipes.filter((recipe) => recipe._id !== id),
      );
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };
  const fetchUserRecipes = async () => {
    try {
      if (!token) return; // Ensure user is logged in
      const response = await fetch(
        "http://localhost:5000/api/recipes/my-recipes",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch recipes");
      setRecipes(data); // Store recipes in state
    } catch (error) {
      console.error("Error fetching user recipes:", error.message);
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        error,
        addRecipe,
        deleteRecipe,
        fetchRecipesByState,
        fetchUserRecipes,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
