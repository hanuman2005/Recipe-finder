const mongoose = require("mongoose");
const Recipe = require("./models/Recipe");
const dotenv = require("dotenv");

dotenv.config();

async function clearRecipes() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/recipe-finder",
    );

    console.log("\n" + "=".repeat(60));
    console.log("🗑️  CLEARING RECIPES DATABASE");
    console.log("=".repeat(60) + "\n");

    const result = await Recipe.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} recipes\n`);

    console.log("=".repeat(60) + "\n");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

clearRecipes();
