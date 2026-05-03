import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, CheckCircle } from "lucide-react";
import { Button, Input, Alert } from "../components/ui";

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  if (password.length < 6) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (/[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password))
    return { score: 3, label: "Strong", color: "bg-green-500" };
  if (password.length >= 8)
    return { score: 2, label: "Fair", color: "bg-yellow-500" };
  return { score: 1, label: "Weak", color: "bg-red-500" };
};

const Signup = () => {
  const { signupUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.includes("@")) return "Enter a valid email";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await signupUser(form.name, form.email, form.password);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);
  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-600 to-primary-600 flex items-center justify-center px-4 py-12">
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
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex justify-center mb-4"
            >
              <div className="bg-white/20 p-3 rounded-full">
                <UserPlus className="text-white" size={32} />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-1">Join Us</h1>
            <p className="text-white/60 text-sm">Create your account to start sharing recipes</p>
          </div>

          {error && <Alert type="glass" message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              icon={User}
              variant="glass"
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              icon={Mail}
              variant="glass"
              required
            />
            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                icon={Lock}
                variant="glass"
                required
              />
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${(strength.score / 3) * 100}%` }}
                        className={`h-full rounded-full ${strength.color}`}
                      />
                    </div>
                    <span className="text-xs text-white/60 w-10">{strength.label}</span>
                  </div>
                  <p className="text-xs text-white/40">Use uppercase, numbers & symbols for strong password</p>
                </div>
              )}
            </div>
            <div>
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                icon={Lock}
                variant="glass"
                required
              />
              {passwordsMatch && (
                <div className="mt-1.5 flex items-center gap-1.5 text-green-300 text-xs">
                  <CheckCircle size={14} />
                  Passwords match
                </div>
              )}
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              <UserPlus size={18} />
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <p className="text-center text-white/60 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-white hover:text-white/80 underline transition">
              Sign in here
            </Link>
          </p>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Your data is secure and encrypted
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
