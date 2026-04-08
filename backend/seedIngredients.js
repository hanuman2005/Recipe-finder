/**
 * INGREDIENT SEEDER - Populates ingredient glossary database
 * Adds ingredient metadata for the ingredient education feature
 */

const Ingredient = require("./models/Ingredient");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const INGREDIENTS = [
  // DAIRY
  {
    name: "Paneer",
    category: "Dairy",
    description: "Fresh Indian cottage cheese, versatile and protein-rich",
    regional_names: new Map([
      ["en", ["Paneer", "Indian Cheese"]],
      ["hi", ["Paneer"]],
      ["ta", ["Panir"]],
      ["bn", ["Chenna"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1588195538326-c5b1e6d55e09?w=600",
      accessibility_description: "White cube-shaped fresh cheese",
    },
    where_to_buy: ["Indian section", "Dairy aisle", "Specialty stores"],
    cooking_tips: [
      "Add at end of cooking to prevent breaking",
      "Press with weight to remove moisture",
    ],
  },
  {
    name: "Yogurt",
    category: "Dairy",
    description: "Fermented dairy product rich in probiotics",
    regional_names: new Map([
      ["en", ["Yogurt"]],
      ["hi", ["Dahi"]],
      ["ta", ["Payiru"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1488477181946-6bc60edffa77?w=600",
      accessibility_description: "Creamy white fermented dairy",
    },
    where_to_buy: ["Dairy section", "Any supermarket"],
    cooking_tips: [
      "Use at room temperature",
      "Don't overheat or it will curdle",
    ],
  },
  {
    name: "Ghee",
    category: "Dairy",
    description: "Clarified butter used in Indian and Asian cooking",
    regional_names: new Map([
      ["en", ["Ghee"]],
      ["hi", ["Ghee"]],
      ["ta", ["Neiyon"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1587279081167-2fdfdfb5b330?w=600",
      accessibility_description: "Golden clarified butter",
    },
    where_to_buy: ["Indian section", "Dairy aisle", "Online"],
    cooking_tips: ["High smoke point, great for frying", "Store in cool place"],
    health_info: {
      calories_per_100g: 900,
      fat_per_100g: 100,
    },
  },
  {
    name: "Milk",
    category: "Dairy",
    description: "Essential dairy ingredient for cooking and beverages",
    regional_names: new Map([
      ["en", ["Milk"]],
      ["hi", ["Doodh"]],
      ["ta", ["Paal"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1550583872-b016773f98d5?w=600",
      accessibility_description: "White liquid dairy product",
    },
    where_to_buy: ["Dairy section", "Any supermarket"],
  },
  {
    name: "Feta Cheese",
    category: "Dairy",
    description: "Crumbly, tangy cheese used in Mediterranean cuisine",
    regional_names: new Map([
      ["en", ["Feta"]],
      ["el", ["Feta"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1638603985903-3a0c6226b4f9?w=600",
      accessibility_description: "Crumbly white cheese",
    },
    where_to_buy: ["Cheese section", "Mediterranean stores"],
  },

  // SPICES & SEASONINGS
  {
    name: "Turmeric",
    category: "Spice",
    description: "Golden spice with anti-inflammatory properties",
    regional_names: new Map([
      ["en", ["Turmeric"]],
      ["hi", ["Haldi"]],
      ["ta", ["Manjal"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1596040706919-9fe76ae44321?w=600",
      accessibility_description: "Golden yellow powder",
    },
    where_to_buy: ["Spice aisle", "Indian stores"],
    health_info: {
      common_allergens: [],
      gluten_free: true,
      keto_friendly: true,
    },
  },
  {
    name: "Cumin Seeds",
    category: "Spice",
    description: "Aromatic seeds used as tempering spice",
    regional_names: new Map([
      ["en", ["Cumin Seed"]],
      ["hi", ["Jeera"]],
      ["ta", ["Jeerakam"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Small brown striped seeds",
    },
    where_to_buy: ["Spice aisle"],
  },
  {
    name: "Coriander Powder",
    category: "Spice",
    description: "Mild, slightly sweet spice powder",
    regional_names: new Map([
      ["en", ["Coriander"]],
      ["hi", ["Dhania"]],
      ["ta", ["Kottamalli"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Brown powder spice",
    },
    where_to_buy: ["Spice aisle"],
  },
  {
    name: "Chili Powder",
    category: "Spice",
    description: "Hot spice for adding heat and color",
    regional_names: new Map([
      ["en", ["Chili"]],
      ["hi", ["Mirch"]],
      ["ta", ["Milagu"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Red hot chili powder",
    },
    where_to_buy: ["Spice aisle"],
    health_info: {
      common_allergens: [],
    },
  },
  {
    name: "Salt",
    category: "Seasoning",
    description: "Essential seasoning agent",
    regional_names: new Map([
      ["en", ["Salt"]],
      ["hi", ["Namak"]],
      ["ta", ["Uppu"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "White crystals",
    },
    where_to_buy: ["Any supermarket"],
  },
  {
    name: "Black Pepper",
    category: "Spice",
    description: "Sharp, peppery seasoning",
    regional_names: new Map([
      ["en", ["Black Pepper"]],
      ["hi", ["Kali Mirch"]],
      ["ta", ["Milagu"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Black peppercorn",
    },
    where_to_buy: ["Spice aisle"],
  },
  {
    name: "Ginger",
    category: "Herb",
    description: "Pungent root used in cooking and medicinal preparations",
    regional_names: new Map([
      ["en", ["Ginger"]],
      ["hi", ["Adrak"]],
      ["ta", ["Inji"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Brown knobby root",
    },
    where_to_buy: ["Produce section"],
  },
  {
    name: "Garlic",
    category: "Herb",
    description: "Aromatic bulb used in most savory cooking",
    regional_names: new Map([
      ["en", ["Garlic"]],
      ["hi", ["Lasun"]],
      ["ta", ["Poondu"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "White bulb with cloves",
    },
    where_to_buy: ["Produce section"],
  },

  // PROTEINS
  {
    name: "Chicken",
    category: "Protein",
    description: "Lean protein commonly used in Asian and world cuisine",
    regional_names: new Map([
      ["en", ["Chicken"]],
      ["hi", ["Murgh"]],
      ["ta", ["Koli"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600",
      accessibility_description: "Meat poultry",
    },
    where_to_buy: ["Meat section"],
    health_info: {
      calories_per_100g: 165,
      protein_per_100g: 31,
    },
  },
  {
    name: "Lentils",
    category: "Legume",
    description: "Protein-rich legume used in curries and salads",
    regional_names: new Map([
      ["en", ["Lentils"]],
      ["hi", ["Dal"]],
      ["ta", ["Paruppu"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1609613655613-8b4fa6025a66?w=600",
      accessibility_description: "Small round legume seeds",
    },
    where_to_buy: ["Dry goods section"],
    health_info: {
      protein_per_100g: 25,
      gluten_free: true,
    },
  },
  {
    name: "Chickpeas",
    category: "Legume",
    description: "Versatile legume used in curries and salads",
    regional_names: new Map([
      ["en", ["Chickpea"]],
      ["hi", ["Chana"]],
      ["ta", ["Kondai Kadalai"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Round beige legume",
    },
    where_to_buy: ["Dry goods section"],
  },
  {
    name: "Shrimp",
    category: "Protein",
    description: "Seafood protein quick to cook",
    regional_names: new Map([
      ["en", ["Shrimp"]],
      ["hi", ["Jhinga"]],
      ["ta", ["Irai"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Pink curved seafood",
    },
    where_to_buy: ["Seafood section"],
  },

  // VEGETABLES
  {
    name: "Spinach",
    category: "Vegetable",
    description: "Leafy green vegetable rich in iron",
    regional_names: new Map([
      ["en", ["Spinach"]],
      ["hi", ["Palak"]],
      ["ta", ["Keerai"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Dark green leafy vegetable",
    },
    where_to_buy: ["Produce section"],
    health_info: {
      calories_per_100g: 23,
      protein_per_100g: 3,
      gluten_free: true,
    },
  },
  {
    name: "Tomato",
    category: "Vegetable",
    description: "Essential ingredient for curries and sauces",
    regional_names: new Map([
      ["en", ["Tomato"]],
      ["hi", ["Tamatar"]],
      ["ta", ["Takkali"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Red round fruit vegetable",
    },
    where_to_buy: ["Produce section"],
  },
  {
    name: "Onion",
    category: "Vegetable",
    description: "Basic aromatic vegetable for cooking base",
    regional_names: new Map([
      ["en", ["Onion"]],
      ["hi", ["Pyaaz"]],
      ["ta", ["Vengaya"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Layered white or brown bulb",
    },
    where_to_buy: ["Produce section"],
  },
  {
    name: "Potato",
    category: "Vegetable",
    description: "Starchy vegetable used in many dishes",
    regional_names: new Map([
      ["en", ["Potato"]],
      ["hi", ["Aloo"]],
      ["ta", ["Urulai"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Brown or yellow round tuber",
    },
    where_to_buy: ["Produce section"],
  },
  {
    name: "Cucumber",
    category: "Vegetable",
    description: "Refreshing vegetable used in salads",
    regional_names: new Map([
      ["en", ["Cucumber"]],
      ["hi", ["Kheera"]],
      ["ta", ["Kumbalanga"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Long green vegetable",
    },
    where_to_buy: ["Produce section"],
  },

  // GRAINS & FLOUR
  {
    name: "Rice",
    category: "Grain",
    description: "Staple grain used in most Asian cuisines",
    regional_names: new Map([
      ["en", ["Rice"]],
      ["hi", ["Chawal"]],
      ["ta", ["Arisi"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "White or brown grains",
    },
    where_to_buy: ["Dry goods section"],
    health_info: {
      calories_per_100g: 130,
      gluten_free: true,
    },
  },
  {
    name: "Wheat Flour",
    category: "Grain",
    description: "All-purpose flour for breads and batters",
    regional_names: new Map([
      ["en", ["Flour"]],
      ["hi", ["Maida"]],
      ["ta", ["Maavu"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "White powder",
    },
    where_to_buy: ["Dry goods section"],
  },
  {
    name: "Lentil Flour",
    category: "Grain",
    description: "Protein-rich flour from ground lentils",
    regional_names: new Map([
      ["en", ["Lentil Flour"]],
      ["hi", ["Besan"]],
      ["ta", ["Paruppu Mavu"]],
    ]),
    images: {
      primary:
        "https://images.unsplash.com/photo-1599599810694-b62b0fa42e0c?w=600",
      accessibility_description: "Yellow powder",
    },
    where_to_buy: ["Indian stores", "Dry goods"],
    health_info: {
      gluten_free: true,
    },
  },
];

async function seedIngredients() {
  try {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`🌱 INGREDIENT GLOSSARY SEEDER`);
    console.log(`${"=".repeat(70)}`);
    console.log(`📊 Total ingredients to seed: ${INGREDIENTS.length}\n`);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/recipe-finder",
      );
      console.log("✅ Connected to MongoDB\n");
    }

    // Clear existing ingredients
    await Ingredient.deleteMany({});

    let successful = 0;
    let failed = 0;

    for (const ingredient of INGREDIENTS) {
      try {
        await Ingredient.create(ingredient);
        successful++;
      } catch (error) {
        failed++;
        console.error(`❌ Failed to create ${ingredient.name}:`, error.message);
      }
    }

    console.log(`${"=".repeat(70)}`);
    console.log(`✅ Successfully: ${successful} | ❌ Failed: ${failed}`);
    console.log(`📊 Total in database: ${successful} ingredients`);
    console.log(`${"=".repeat(70)}\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Fatal error:", error.message);
  }
}

seedIngredients();
