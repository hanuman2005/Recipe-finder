import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ToastContainer from "./components/shared/ToastContainer";
import Navbar from "./components/shared/Navbar";
import Footer from "./components/shared/Footer";
import { AuthProvider } from "./context/AuthContext";
import { RecipeProvider } from "./context/RecipeContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import UploadRecipe from "./pages/UploadRecipe";
import RecipeDetails from "./pages/RecipeDetails";
import SearchResults from "./pages/SearchResults";
import CategoryPage from "./pages/CategoryPage";
import RegionRecipes from "./pages/RegionRecipes";
import Favourites from "./pages/Favourites";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <RecipeProvider>
            <ToastContainer />
            <Navbar />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/upload" element={<UploadRecipe />} />
                <Route path="/region/:state" element={<RegionRecipes />} />
                <Route path="/recipe/:id" element={<RecipeDetails />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/favourites" element={<Favourites />} />
              </Routes>
            </main>
            <Footer />
          </RecipeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
