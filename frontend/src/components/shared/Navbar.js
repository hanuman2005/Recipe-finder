import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, X, ChevronDown, LogOut, User, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import clsx from "clsx";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const handleStateChange = (state) => {
    navigate(`/region/${state}`);
    setStateOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary-500">
              🍽️ SPICE SCOOP
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {/* State Selector */}
            <div className="relative">
              <button
                onClick={() => setStateOpen(!stateOpen)}
                className="flex items-center gap-1 text-neutral-700 hover:text-primary-500 font-medium"
              >
                States
                <ChevronDown size={18} />
              </button>

              {stateOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto w-48 z-50"
                >
                  {indianStates.map((state) => (
                    <button
                      key={state}
                      onClick={() => handleStateChange(state)}
                      className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary-500"
                    >
                      {state}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Search */}
            <Link
              to="/search"
              className="text-neutral-700 hover:text-primary-500 font-medium"
            >
              🔍 Search
            </Link>

            {/* Auth Links */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/upload">
                  <Button size="md" className="flex items-center gap-2">
                    <Plus size={18} />
                    Add Recipe
                  </Button>
                </Link>

                <Link
                  to="/profile"
                  className="text-neutral-700 hover:text-primary-500"
                >
                  <User size={20} />
                </Link>

                <button
                  onClick={logoutUser}
                  className="text-neutral-700 hover:text-primary-500"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="md">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="md">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 border-t"
            >
              <div className="flex flex-col gap-4">
                {/* State Dropdown Mobile */}
                <select
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="input-field"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                <Link to="/search" className="text-neutral-700 font-medium">
                  🔍 Search
                </Link>

                {user ? (
                  <>
                    <Link to="/upload">
                      <Button size="md" className="w-full">
                        Add Recipe
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="outline" size="md" className="w-full">
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={logoutUser}
                      className="w-full"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outline" size="md" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button size="md" className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
