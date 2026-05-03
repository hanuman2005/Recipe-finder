// ========== CORE DEPENDENCIES ==========
const mongoose = require("mongoose"); // MongoDB ODM library
const bcryptjs = require("bcryptjs"); // Password hashing library (one-way encryption)

// ========== USER SCHEMA DEFINITION ==========
// Defines the structure and validation rules for User documents in MongoDB
const userSchema = new mongoose.Schema(
  {
    // ========== NAME FIELD ==========
    name: {
      type: String, // Data type: text string
      required: [true, "Name is required"], // Must provide name when creating user
      trim: true, // Automatically remove leading/trailing whitespace
      minlength: [2, "Name must be at least 2 characters"], // Prevents single letter names
      maxlength: [50, "Name cannot exceed 50 characters"], // Prevents excessively long names
    },

    // ========== EMAIL FIELD ==========
    email: {
      type: String, // Data type: text string
      required: [true, "Email is required"], // Must provide email
      unique: true, // No two users can have same email (enforced by database)
      trim: true, // Remove whitespace around email
      lowercase: true, // Convert email to lowercase for case-insensitive matching
      match: [
        // Email must match this regex pattern (valid email format)
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address", // Error message if doesn't match
      ],
    },

    // ========== PASSWORD FIELD ==========
    password: {
      type: String, // Data type: text string (will be hashed before saving)
      required: [true, "Password is required"], // Must provide password
      minlength: [6, "Password must be at least 6 characters"], // Minimum 6 characters
      select: false, // IMPORTANT: Don't return password in queries unless explicitly requested
      // This prevents accidental password exposure in API responses
    },

    // ========== JWT REFRESH TOKEN FIELD ==========
    refreshToken: {
      type: String, // Data type: text string
      default: null, // No token initially (set after successful login)
      select: false, // Don't return token in queries by default (security)
    },

    // ========== EMAIL VERIFICATION STATUS ==========
    isVerified: {
      type: Boolean, // Data type: true/false
      default: false, // New users not verified by default (email verification feature)
    },

    // ========== FAVORITES - ARRAY OF FAVORITE RECIPES ==========
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId, // References Recipe model's _id
        ref: "Recipe", // Points to Recipe collection (establishes relationship)
      },
      // Example: favorites: ["6407d451e123456789abc001", "6407d451e123456789abc002"]
    ],
  },

  // ========== SCHEMA OPTIONS ==========
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
    // createdAt: when user was created
    // updatedAt: when user was last modified
  },
);

// ========== DATABASE INDEXES FOR PERFORMANCE ==========
// Indexes speed up database queries by pre-sorting data

// Index on email field for O(log n) lookup during login/registration
// Without index, MongoDB must scan all users to find by email
userSchema.index({ email: 1 }); // 1 = ascending order

// Index on createdAt for fast sorting of newest users first
userSchema.index({ createdAt: -1 }); // -1 = descending order (newest first)

// ========== PRE-HOOK MIDDLEWARE - HASH PASSWORD BEFORE SAVING ==========
// A pre-hook runs BEFORE the Mongoose save operation
// This ensures passwords are never stored in plain text
userSchema.pre("save", async function (next) {
  // Check if password field has been modified (new user or password change)
  // Only hash if password was added/changed, not on other updates
  if (this.isModified("password")) {
    // Generate salt: random data mixed with password for extra security
    // Higher number = more secure but slower (10 is recommended)
    const salt = await bcryptjs.genSalt(10);

    // Hash password using bcrypt algorithm
    // Results in a string like: $2a$10$N9qo8uLO... (salted + hashed)
    // Hashing is one-way: cannot decrypt to get original password
    this.password = await bcryptjs.hash(this.password, salt);
  }

  // Call next() to continue with the save operation
  next();
});

// ========== CREATE MONGOOSE MODEL ==========
// Model is the interface for interacting with User collection in database
// First param: "User" = collection name in MongoDB (pluralized to "users")
// Second param: userSchema = schema defining document structure
const User = mongoose.model("User", userSchema);

// ========== EXPORT USER MODEL ==========
// Export so other files can import and use User model
// Usage: const User = require('./models/User');
module.exports = User;
