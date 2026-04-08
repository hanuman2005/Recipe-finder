/**
 * PRO TIP SUBMISSION SEEDER - Populates sample pro tips
 * Seeds pro tips for testing the pro tips feature (#4)
 */

const ProTipSubmission = require("./models/ProTipSubmission");
const Recipe = require("./models/Recipe");
const User = require("./models/User");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const PRO_TIPS = [
  {
    title: "Double-Fry Samosa Technique",
    technique:
      "Fry samosas twice - first at 160°C for 5 minutes, rest for 10, then second fry at 180°C for 2 minutes",
    level: "Advanced",
    temperature: 170,
    timing: "5 min + 2 min",
    explanation:
      "First fry cooks the filling gently and sets the pastry. Resting allows moisture to redistribute. Second fry creates the perfect crispy exterior while keeping filling warm.",
    region: "North India",
  },
  {
    title: "Paneer Marinade Secret",
    technique:
      "Marinate paneer blocks in yogurt with turmeric for 30 minutes before cooking. Pat dry before adding to heat.",
    level: "Beginner",
    temperature: null,
    timing: "30 minutes",
    explanation:
      "Turmeric acts as a binder and seals moisture, preventing paneer from drying out during cooking. Patting dry removes excess marinade that would cause splashing.",
    region: "North India",
  },
  {
    title: "Tempering Oil Perfection",
    technique:
      "Heat oil until it shimmers (170-180°C), then add mustard seeds. Cover immediately to trap the 'pop' aroma.",
    level: "Intermediate",
    temperature: 175,
    timing: "2 minutes",
    explanation:
      "The shimmering indicates oil is hot enough to activate the mustard seed's essential oils. Covering traps aromatics which infuse throughout the dish.",
    region: "South India",
  },
  {
    title: "Dosa Batter Consistency Trick",
    technique:
      "Batter should coat a spoon for 2-3 seconds. If too thick, add 1 tablespoon water at a time. Remember: thinner batter = crispier dosa.",
    level: "Beginner",
    temperature: null,
    timing: "Variable",
    explanation:
      "Batter viscosity directly affects crispness. Thin batter spreads evenly on the griddle, creating even crisping. Thicker batter creates chewy texture.",
    region: "South India",
  },
  {
    title: "Bread Pakora Golden Exterior",
    technique:
      "Soak bread in batter for exactly 3 seconds per side. Deep fry at 175°C for 90 seconds per side.",
    level: "Intermediate",
    temperature: 175,
    timing: "3 minutes total",
    explanation:
      "3-second soak ensures batter penetrates without over-soaking (which makes bread soggy). 90 seconds creates golden crust while keeping bread warm inside.",
    region: "North India",
  },
  {
    title: "Lachcha Paratha Layering Method",
    technique:
      "Roll dough, brush with ghee, make 5-6 accordion folds, then coil. Don't compress - let air become your leavening.",
    level: "Advanced",
    temperature: null,
    timing: "Technique only",
    explanation:
      "Accordion folds trap air pockets between ghee layers. Coiling keeps these pockets sealed. During cooking, steam creates layers. Compression releases air and ruins texture.",
    region: "North India",
  },
  {
    title: "Chole Bhature Fermentation Science",
    technique:
      "Ferment dough for 6-8 hours at room temperature. Batter should double in volume. Temperature matters - too cold = no rise, too hot = over-fermented.",
    level: "Advanced",
    temperature: null,
    timing: "6-8 hours",
    explanation:
      "Fermentation creates CO2 bubbles through yeast activity. This creates the fluffy texture. Over-fermentation breaks down gluten structure, making dough collapse.",
    region: "North India",
  },
  {
    title: "Chikhalwali Crisp Factor",
    technique:
      "Cut vegetables immediately before coating. The moisture from fresh cuts creates steam during frying, puffing the batter.",
    level: "Intermediate",
    temperature: null,
    timing: "Immediate prep",
    explanation:
      "Surface moisture is key - it creates steam pockets that puff the batter. Pre-cut vegetables lose this moisture through evaporation.",
    region: "North India",
  },
  {
    title: "Spice Temperature Control",
    technique:
      "Toast whole spices at 120-130°C for 30 seconds. Avoid smoking - burned spices turn bitter instantly.",
    level: "Intermediate",
    temperature: 125,
    timing: "30 seconds",
    explanation:
      "Gentle toasting activates essential oils. Higher temperatures denature (break down) aromatic compounds, causing bitterness.",
    region: "India",
  },
  {
    title: "Yogurt Temper Without Curdling",
    technique:
      "Add hot curry to yogurt SLOWLY while whisking constantly. Ratio: 1 tablespoon yogurt in 3 tablespoons curry first (acclimatize), then combine.",
    level: "Beginner",
    temperature: null,
    timing: "2 minutes",
    explanation:
      "Gradual temperature increase allows yogurt proteins to relax. Rapid heating causes proteins to coagulate and separate into curd and whey.",
    region: "India",
  },
];

async function seedProTips() {
  try {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`🌟 PRO TIP SUBMISSION SEEDER`);
    console.log(`${"=".repeat(70)}`);
    console.log(`📊 Total pro tips to seed: ${PRO_TIPS.length}\n`);

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

    // Get sample recipes
    const recipes = await Recipe.find().limit(10);
    if (recipes.length === 0) {
      console.error("❌ No recipes found. Seed recipes first.");
      return;
    }

    console.log(`📖 Found ${recipes.length} recipes for tips\n`);

    // Clear existing pro tips
    await ProTipSubmission.deleteMany({});

    let successful = 0;
    let failed = 0;

    // Create pro tips
    for (let i = 0; i < PRO_TIPS.length; i++) {
      try {
        const tip = PRO_TIPS[i];
        const recipe = recipes[i % recipes.length]; // Distribute across recipes
        const stepNumber = (i % 5) + 1; // Steps 1-5

        await ProTipSubmission.create({
          recipe: recipe._id,
          stepNumber: stepNumber,
          submittedBy: adminUser._id,
          title: tip.title,
          technique: tip.technique,
          level: tip.level,
          temperature: tip.temperature,
          timing: tip.timing,
          explanation: tip.explanation,
          region: tip.region,
          status: "approved", // Pre-approve for easier testing
          reviewedBy: adminUser._id,
          approvedAt: new Date(),
          helpfulCount: Math.floor(Math.random() * 50),
        });
        successful++;
      } catch (error) {
        failed++;
        console.error(`❌ Failed to create pro tip ${i + 1}:`, error.message);
      }
    }

    console.log(`${"=".repeat(70)}`);
    console.log(`✅ Successfully: ${successful} | ❌ Failed: ${failed}`);
    console.log(`📊 Total pro tips in database: ${successful}`);
    console.log(`${"=".repeat(70)}\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Fatal error:", error.message);
  }
}

seedProTips();
