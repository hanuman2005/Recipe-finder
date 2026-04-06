import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Flame } from "lucide-react";
import { motion } from "framer-motion";
import Badge from "../ui/Badge";

export const RecipeCard = ({ recipe }) => {
  const imageUrl =
    recipe.image || "https://via.placeholder.com/300x200?text=Recipe";

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link to={`/recipe/${recipe._id}`} className="block h-full">
        <div className="card overflow-hidden h-full flex flex-col">
          {/* Image */}
          <div className="relative overflow-hidden h-48 bg-gray-200">
            <motion.img
              src={imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/300x200?text=Recipe";
              }}
            />

            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="primary" size="sm">
                {recipe.category}
              </Badge>
            </div>

            {/* Rating Badge */}
            {recipe.rating && (
              <div className="absolute top-3 right-3 bg-yellow-400 text-white px-2 py-1 rounded-full flex items-center gap-1 text-sm font-bold">
                <Star size={14} fill="white" />
                {recipe.rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-2">
              {recipe.title}
            </h3>

            <p className="text-sm text-neutral-600 mb-4 line-clamp-2 flex-1">
              {recipe.description || "No description"}
            </p>

            {/* Meta Info */}
            <div className="flex gap-4 text-sm text-neutral-600 mb-4">
              {recipe.prepTime && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {recipe.prepTime}m
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-1">
                  <Flame size={14} />
                  {recipe.cookTime}m
                </div>
              )}
            </div>

            {/* Equipment Tags */}
            {recipe.equipment && recipe.equipment.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.equipment.slice(0, 2).map((equip, idx) => (
                  <Badge key={idx} variant="secondary" size="sm">
                    {equip}
                  </Badge>
                ))}
                {recipe.equipment.length > 2 && (
                  <Badge variant="secondary" size="sm">
                    +{recipe.equipment.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* CTA */}
            <button className="w-full bg-primary-500 text-white py-2 rounded-lg font-semibold hover:bg-primary-600 transition">
              View Recipe →
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default RecipeCard;
