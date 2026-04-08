/**
 * COMMENTS SEEDER - Populates sample comments on recipes
 * Seeds comments linking RECIPES → USERS
 */

const Comment = require("./models/Comment");
const Recipe = require("./models/Recipe");
const User = require("./models/User");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const COMMENT_TEMPLATES = [
  {
    text: "This recipe turned out amazing! The step-by-step instructions were so clear.",
    rating: 5,
  },
  {
    text: "Good recipe but I had to adjust the spice levels for my family.",
    rating: 4,
  },
  {
    text: "Perfect for beginners! Made it on my first try.",
    rating: 5,
  },
  {
    text: "Takes longer than expected but worth the time.",
    rating: 4,
  },
  {
    text: "Delicious! Will definitely make this again.",
    rating: 5,
  },
  {
    text: "A bit tricky but the pro tips really helped.",
    rating: 4,
  },
  {
    text: "Family loved it! Even the kids enjoyed this.",
    rating: 5,
  },
  {
    text: "Good alternative to the traditional version.",
    rating: 4,
  },
  {
    text: "Simple ingredients but incredible flavor.",
    rating: 5,
  },
  {
    text: "Followed the recipe exactly and it was perfect.",
    rating: 5,
  },
];

async function seedComments() {
  try {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`💬 COMMENTS SEEDER`);
    console.log(`${"=".repeat(70)}`);
    console.log(`📊 Total comments to seed: ${COMMENT_TEMPLATES.length * 8}\n`);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/recipe-finder",
      );
      console.log("✅ Connected to MongoDB\n");
    }

    // Get admin user
    let adminUser = await User.findOne({ email: "admin@recipefinder.com" });
    if (!adminUser) {
      console.log("👤 Creating admin user...");
      adminUser = await User.create({
        name: "Recipe Finder Admin",
        email: "admin@recipefinder.com",
        password: "admin123",
        role: "admin",
      });
    }

    // Create sample users for commenting
    let users = await User.find();
    if (users.length === 1) {
      console.log("👥 Creating sample users for comments...");
      const newUsers = await User.create([
        {
          name: "Priya Sharma",
          email: "priya@example.com",
          password: "password123",
        },
        {
          name: "Rahul Kumar",
          email: "rahul@example.com",
          password: "password123",
        },
      ]);
      users = [adminUser, ...newUsers];
    }

    // Get recipes
    const recipes = await Recipe.find().limit(8);
    if (recipes.length === 0) {
      console.error("❌ No recipes found. Seed recipes first.");
      return;
    }

    console.log(`📖 Found ${recipes.length} recipes\n`);

    // Clear existing comments
    await Comment.deleteMany({});

    let successful = 0;
    let failed = 0;

    // Create comments
    for (let i = 0; i < recipes.length; i++) {
      for (let j = 0; j < COMMENT_TEMPLATES.length; j++) {
        try {
          const template = COMMENT_TEMPLATES[j];
          const commenter = users[j % users.length];

          await Comment.create({
            recipeId: recipes[i]._id,
            userId: commenter._id,
            username: commenter.name,
            text: template.text,
            rating: template.rating,
          });
          successful++;
        } catch (error) {
          failed++;
        }
      }
    }

    console.log(`${"=".repeat(70)}`);
    console.log(`✅ Successfully: ${successful} | ❌ Failed: ${failed}`);
    console.log(`📊 Total comments in database: ${successful}`);
    console.log(`${"=".repeat(70)}\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Fatal error:", error.message);
  }
}

seedComments();
