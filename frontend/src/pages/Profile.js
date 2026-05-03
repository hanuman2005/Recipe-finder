import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { RecipeContext } from "../context/RecipeContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Trash2, Eye, Plus, User, Mail, ChefHat, Calendar, Zap } from "lucide-react";
import { Button, LoadingSkeleton, EmptyState, Modal, Card, Badge } from "../components/ui";
import LeftoverPantry from "../components/LeftoverPantry";
import LeftoverSuggestions from "../components/LeftoverSuggestions";

const StatCard = ({ emoji, label, value }) => (
  <Card padding="md">
    <p className="text-neutral-500 text-sm mb-1 flex items-center gap-1.5">{emoji} {label}</p>
    <p className="text-3xl font-bold text-neutral-900">{value}</p>
  </Card>
);

const Profile = () => {
  const { user, token, logout } = useAuth();
  const { recipes, fetchUserRecipes } = useContext(RecipeContext);
  const navigate = useNavigate();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (token) fetchUserRecipes();
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`http://localhost:5000/api/recipes/${deleteTarget}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete recipe");
      fetchUserRecipes();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-14 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-white/30 overflow-hidden">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/013/042/571/large_2x/default-avatar-profile-icon-social-media-user-photo-in-flat-style-vector.jpg"
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-400 w-5 h-5 rounded-full border-2 border-white" />
            </div>

            {/* User Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
              <div className="flex flex-col sm:flex-row items-center gap-3 text-white/70 text-sm">
                <span className="flex items-center gap-1.5"><Mail size={14} />{user.email}</span>
                <span className="flex items-center gap-1.5"><ChefHat size={14} />Home Chef</span>
              </div>
            </div>

            <Button variant="danger" size="md" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard emoji="📝" label="Recipes Created" value={recipes.length} />
          <StatCard
            emoji="📅"
            label="Member Since"
            value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
          />
          <StatCard emoji="🎯" label="Status" value="Active Chef" />
        </motion.div>

        {/* Leftover Pantry */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">📦 My Leftover Pantry</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="none" className="overflow-hidden">
              <LeftoverPantry userId={user._id} />
            </Card>
            <Card padding="none" className="overflow-hidden">
              <LeftoverSuggestions userId={user._id} />
            </Card>
          </div>
        </motion.section>

        {/* Your Recipes */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">🍳 Your Recipes</h2>
            <Button to="/upload" size="md">
              <Plus size={18} />
              New Recipe
            </Button>
          </div>

          {recipes.length === 0 ? (
            <EmptyState
              icon={User}
              title="No recipes yet"
              description="Start creating your first recipe to share with the community"
              actionTo="/upload"
              actionLabel="Create First Recipe"
            />
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {recipes.map((recipe, idx) => (
                  <motion.div
                    key={recipe._id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Card padding="none" className="overflow-hidden group">
                      {/* Recipe Image */}
                      <div className="relative h-44 overflow-hidden bg-neutral-200">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="white"
                            size="sm"
                            onClick={() => navigate(`/recipe/${recipe._id}`)}
                          >
                            <Eye size={16} />
                            View
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(recipe._id)}
                          >
                            <Trash2 size={16} />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Recipe Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-neutral-900 mb-1 line-clamp-1">{recipe.title}</h3>
                        <p className="text-neutral-500 text-sm line-clamp-2 mb-3">{recipe.description}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {recipe.category && <Badge variant="primary" size="sm">{recipe.category}</Badge>}
                          {recipe.difficulty && <Badge variant="secondary" size="sm">{recipe.difficulty}</Badge>}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Recipe?"
        size="sm"
      >
        <div className="p-6">
          <p className="text-neutral-600 mb-6">
            Are you sure you want to delete this recipe? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth loading={deleteLoading} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
