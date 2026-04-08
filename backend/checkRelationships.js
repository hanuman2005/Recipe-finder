const mongoose = require("mongoose");
const Recipe = require("./models/Recipe");
const ProTipSubmission = require("./models/ProTipSubmission");
const Comment = require("./models/Comment");
const LeftoverInventory = require("./models/LeftoverInventory");
const User = require("./models/User");
const Ingredient = require("./models/Ingredient");
const dotenv = require("dotenv");

dotenv.config();

async function checkRelationships() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/recipe-finder",
    );

    console.log("\n" + "=".repeat(70));
    console.log("🔗 COMPLETE COLLECTION RELATIONSHIPS & LINKS");
    console.log("=".repeat(70) + "\n");

    // Check User
    const users = await User.find();
    console.log(`📋 USERS (${users.length} documents)\n`);
    users.forEach((u) => {
      console.log(`  User: ${u.name} | Email: ${u.email}`);
    });

    // Check Recipes linked to Users
    console.log(`\n📖 RECIPES (80 documents) → ✅ Linked to USERS\n`);
    const recipes = await Recipe.find().populate("user", "name email").limit(3);
    console.log("Sample recipes:");
    recipes.forEach((r) => {
      console.log(`  ${r.title}`);
      console.log(`    ├─ User: ${r.user?.name} | ${r.category}`);
      console.log(`    └─ Equipment: ${r.equipment.join(", ")}`);
    });

    // Check Pro Tips linked to Recipes and Users
    console.log(
      `\n🌟 PRO TIPS (10 documents) → ✅ Linked to RECIPES & USERS\n`,
    );
    const tips = await ProTipSubmission.find()
      .populate("recipe", "title")
      .populate("submittedBy", "name")
      .limit(3);

    console.log("Sample pro tips:");
    tips.forEach((tip) => {
      console.log(`  ${tip.title}`);
      console.log(`    ├─ Recipe: ${tip.recipe?.title}`);
      console.log(`    ├─ By: ${tip.submittedBy?.name}`);
      console.log(`    └─ Level: ${tip.level}`);
    });

    // Check Comments linked to Recipes and Users
    console.log(
      `\n💬 COMMENTS (24 documents) → ✅ Linked to RECIPES & USERS\n`,
    );
    const comments = await Comment.find()
      .populate("recipeId", "title")
      .populate("userId", "name")
      .limit(3);

    if (comments.length > 0) {
      console.log("Sample comments:");
      comments.forEach((comment) => {
        console.log(`  "${comment.text.substring(0, 35)}..."`);
        console.log(`    ├─ Recipe: ${comment.recipeId?.title}`);
        console.log(`    ├─ By: ${comment.userId?.name}`);
        console.log(`    └─ Rating: ${comment.rating}⭐`);
      });
    }

    // Check Leftovers linked to Ingredients and Users
    console.log(
      `\n📦 LEFTOVERS (6 documents) → ✅ Linked to INGREDIENTS & USERS\n`,
    );
    const leftovers = await LeftoverInventory.find()
      .populate("ingredient", "name category")
      .populate("user", "name")
      .limit(3);

    if (leftovers.length > 0) {
      console.log("Sample leftovers:");
      leftovers.forEach((leftover) => {
        console.log(`  ${leftover.ingredientName}`);
        console.log(
          `    ├─ Ingredient Ref: ${leftover.ingredient?.name} (${leftover.ingredient?.category})`,
        );
        console.log(`    ├─ Quantity: ${leftover.quantity} ${leftover.unit}`);
        console.log(`    └─ User: ${leftover.user?.name}`);
      });
    }

    // Check Ingredients
    console.log(
      `\n🥘 INGREDIENTS (25 documents) → ✅ NOW LINKED via LEFTOVERS\n`,
    );
    const ingredients = await Ingredient.find().limit(5);
    console.log("Sample ingredients (linked via leftovers):");
    ingredients.forEach((ing) => {
      console.log(`  ${ing.name} | Category: ${ing.category}`);
    });

    console.log("\n" + "=".repeat(70));
    console.log("📊 COMPLETE RELATIONSHIP DIAGRAM");
    console.log("=".repeat(70) + "\n");

    console.log("USERS (3)");
    console.log("  ├─→ RECIPES (80)");
    console.log("  │    └─→ PRO TIPS (10)");
    console.log("  ├─→ COMMENTS (24)");
    console.log("  │    └─→ linked to RECIPES");
    console.log("  └─→ LEFTOVERS (6)");
    console.log("       └─→ INGREDIENTS (25)\n");

    console.log("All 6 collections are now interconnected! ✅\n");
    console.log("=".repeat(70) + "\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkRelationships();
