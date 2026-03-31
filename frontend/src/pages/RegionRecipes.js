import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const RegionRecipes = () => {
  const { state } = useParams(); // Get selected state from URL
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!state) return; // Avoid unnecessary API calls

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setRecipes([]); // Clear old recipes before fetching

        const response = await fetch(
          `http://localhost:5000/api/recipes/state/${encodeURIComponent(state)}`,
        );

        if (!response.ok) {
          throw new Error("No recipes found for this region.");
        }

        const data = await response.json();

        // Handle both response formats
        const recipesArray = data.data || (Array.isArray(data) ? data : []);
        setRecipes(Array.isArray(recipesArray) ? recipesArray : []);
        setError(null); // Clear previous errors if successful
      } catch (error) {
        setError(error.message);
        setRecipes([]); // Ensure no old data is displayed on failure
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [state]);

  return (
    <div className="container mt-4">
      <h2 className="text-center">Recipes from {state}</h2>

      {loading && (
        <p className="text-center text-primary">Loading recipes...</p>
      )}
      {error && <p className="text-center text-danger">{error}</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="text-center text-warning">
          No recipes found for this region.
        </p>
      )}

      <div className="row">
        {Array.isArray(recipes) &&
          recipes.map((recipe) => (
            <div key={recipe._id} className="col-12 col-md-6 col-lg-4 mb-4">
              <Link
                to={`/recipe/${recipe._id}`}
                className="text-decoration-none"
              >
                <div className="card h-100 shadow">
                  <img
                    src={recipe.image}
                    className="card-img-top"
                    alt={recipe.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{recipe.title}</h5>
                    <p className="card-text">{recipe.description}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RegionRecipes;
