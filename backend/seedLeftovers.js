/**
 * LEFTOVER INVENTORY SEEDER - Populates sample leftovers
 * Seeds leftovers linking USERS → INGREDIENTS
 * This creates the link between Ingredients and LeftoverInventory
 */

const LeftoverInventory = require("./models/LeftoverInventory");
const Ingredient = require("./models/Ingredient");
const User = require("./models/User");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const LEFTOVERS = [
  { name: "Paneer", quantity: 250, unit: "grams", daysLeft: 5 },
  { name: "Yogurt", quantity: 500, unit: "ml", daysLeft: 7 },
  { name: "Ghee", quantity: 100, unit: "ml", daysLeft: 30 },
  { name: "Milk", quantity: 1, unit: "liter", daysLeft: 3 },
  { name: "Spinach", quantity: 200, unit: "grams", daysLeft: 4 },
  { name: "Tomato", quantity: 5, unit: "pieces", daysLeft: 7 },
  { name: "Onion", quantity: 10, unit: "pieces", daysLeft: 20 },
  { name: "Potato", quantity: 1, unit: "kg", daysLeft: 14 },
  { name: "Chicken", quantity: 500, unit: "grams", daysLeft: 2 },
  { name: "Lentils", quantity: 500, unit: "grams", daysLeft: 60 },
];

async function seedLeftovers() {
  try {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📦 LEFTOVER INVENTORY SEEDER`);
    console.log(`${"=".repeat(70)}`);
    console.log(`📊 Total leftovers to seed: ${LEFTOVERS.length * 3}\n`);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/recipe-finder",
      );
      console.log("✅ Connected to MongoDB\n");
    }

    // Get or create users
    let users = await User.find();
    if (users.length === 1) {
      console.log("👥 Creating sample users...");
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
      users = users.concat(newUsers);
    }

    // Get ingredients
    const ingredients = await Ingredient.find();
    if (ingredients.length === 0) {
      console.error("❌ No ingredients found. Seed ingredients first.");
      return;
    }

    console.log(`🥘 Found ${ingredients.length} ingredients\n`);

    // Clear existing leftovers
    await LeftoverInventory.deleteMany({});

    let successful = 0;
    let failed = 0;

    // Create leftovers - each user gets some items
    for (const user of users) {
      for (let i = 0; i < LEFTOVERS.length; i++) {
        try {
          const leftover = LEFTOVERS[i];
          const ingredient = ingredients[i % ingredients.length];

          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + leftover.daysLeft);

          await LeftoverInventory.create({
            user: user._id,
            ingredient: ingredient._id, // ✅ LINK TO INGREDIENT
            ingredientName: ingredient.name,
            quantity: leftover.quantity,
            unit: leftover.unit,
            expiremissionDate: expiryDate,
            storageInstructions: "Store in cool, dry place or refrigerate",
          });
          successful++;
        } catch (error) {
          failed++;
        }
      }
    }

    console.log(`${"=".repeat(70)}`);
    console.log(`✅ Successfully: ${successful} | ❌ Failed: ${failed}`);
    console.log(`📊 Total leftovers in database: ${successful}`);
    console.log(`${"=".repeat(70)}\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Fatal error:", error.message);
  }
}

seedLeftovers();
