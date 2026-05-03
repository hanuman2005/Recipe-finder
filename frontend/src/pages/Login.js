import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock } from "lucide-react";
import { Button, Input, Alert } from "../components/ui";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  const validate = () => {
    if (!credentials.email.trim()) return "Email is required";
    if (!credentials.email.includes("@")) return "Enter a valid email";
    if (!credentials.password) return "Password is required";
    if (credentials.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message || "Invalid email or password"); return; }
      if (!json.authtoken) { setError("Token not received from server"); return; }
      localStorage.setItem("token", json.authtoken);
      navigate("/");
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex justify-center mb-4"
            >
              <div className="bg-white/20 p-3 rounded-full">
                <LogIn className="text-white" size={32} />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-white/60 text-sm">Sign in to access your recipes</p>
          </div>

          {error && <Alert type="glass" message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={credentials.email}
              onChange={handleChange}
              icon={Mail}
              variant="glass"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              icon={Lock}
              variant="glass"
              required
            />
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              <LogIn size={18} />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <p className="text-center text-white/60 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-white hover:text-white/80 underline transition">
              Sign up here
            </Link>
          </p>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Secure login with encrypted credentials
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
