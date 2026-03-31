import React from "react";
import { Link } from "react-router-dom";

const RecipeCard = ({ recipe }) => {
  // Generate SVG placeholder image (no external dependencies)
  const generateSvgPlaceholder = (title) => {
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="200" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle" font-family="Arial">
          ${title.substring(0, 20)}
        </text>
        <text x="50%" y="65%" font-size="14" fill="#ccc" text-anchor="middle" dominant-baseline="middle" font-family="Arial">
          🍽️ ${recipe.category || "Recipe"}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const getImageUrl = () => {
    if (!recipe.image) {
      return generateSvgPlaceholder(recipe.title);
    }

    // Check if image is valid URL
    try {
      new URL(recipe.image);
      return recipe.image;
    } catch {
      // If not valid URL, return SVG placeholder
      return generateSvgPlaceholder(recipe.title);
    }
  };

  const imageUrl = getImageUrl();

  return (
    <Link to={`/recipe/${recipe._id}`} style={{ textDecoration: "none" }}>
      <div
        className="card h-100 recipe-card"
        style={{ cursor: "pointer", transition: "transform 0.3s" }}
      >
        <img
          src={imageUrl}
          className="card-img-top"
          alt={recipe.title}
          onError={(e) => {
            const svg = `
              <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f0f0f0"/>
                <text x="50%" y="50%" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle" font-family="Arial">
                  ${recipe.title.substring(0, 20)}
                </text>
                <text x="50%" y="65%" font-size="14" fill="#ccc" text-anchor="middle" dominant-baseline="middle" font-family="Arial">
                  🍽️ ${recipe.category || "Recipe"}
                </text>
              </svg>
            `;
            e.target.src = `data:image/svg+xml;base64,${btoa(svg)}`;
          }}
          style={{ height: "200px", objectFit: "cover" }}
        />
        <div className="card-body">
          <h5
            className="card-title"
            style={{ fontWeight: "bold", color: "#333" }}
          >
            {recipe.title}
          </h5>
          <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
            {recipe.description?.substring(0, 60)}...
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <span
              className="badge bg-info text-dark"
              style={{ fontSize: "0.8rem" }}
            >
              {recipe.category}
            </span>
            <span className="badge bg-success" style={{ fontSize: "0.8rem" }}>
              {recipe.state}
            </span>
          </div>

          <p style={{ marginTop: "10px", color: "#666", fontSize: "0.85rem" }}>
            📍 {recipe.state}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
