// seed.js - Seed database with dummy recipe data
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Recipe = require("./models/Recipe");

dotenv.config();

const dummyRecipes = [
  // ==================== BREAKFAST ====================
  {
    title: "Masala Dosa",
    description: "Crispy South Indian crepe filled with spiced potato curry",
    image: "https://via.placeholder.com/300?text=Masala+Dosa",
    // ========== TASK 1: Ingredient Function Field ==========
    // Each ingredient now includes functionType and substitutes array
    // functionType: "Base", "Protein", "Vegetable", "Thickener", "Binder", "Seasoning", "Acid", "Fat", "Leavening", "Flavoring"
    ingredients: [
      {
        name: "Rice flour",
        quantity: 2,
        unit: "cup",
        functionType: "Base",
        substitutes: [
          {
            name: "Regular rice (grind yourself)",
            ratio: "1:1",
            explanation:
              "Rice flour is just ground rice mixed with water. You can use regular rice instead.",
          },
        ],
      },
      {
        name: "Urad dal",
        quantity: 1,
        unit: "cup",
        functionType: "Binder",
        substitutes: [
          {
            name: "Gram flour + yogurt",
            ratio: "1:1 + 2 tbsp yogurt",
            explanation:
              "Gram flour and yogurt together provide the binding effect that urad dal gives.",
          },
        ],
      },
      {
        name: "Potatoes",
        quantity: 4,
        unit: "piece",
        functionType: "Vegetable",
        substitutes: [
          {
            name: "Sweet potatoes",
            ratio: "1:1",
            explanation:
              "Sweet potatoes have more flavor and nutrition, similar texture when cooked.",
          },
        ],
      },
      {
        name: "Mustard seeds",
        quantity: 1,
        unit: "tsp",
        functionType: "Seasoning",
        substitutes: [
          {
            name: "Cumin seeds",
            ratio: "1:1",
            explanation:
              "Similar aromatic kick, slightly different flavor profile but works well.",
          },
        ],
      },
      {
        name: "Oil",
        quantity: 3,
        unit: "tbsp",
        functionType: "Fat",
        substitutes: [
          {
            name: "Ghee",
            ratio: "1:1",
            explanation:
              "Ghee adds richer flavor and is better for high-heat cooking.",
          },
          {
            name: "Coconut oil",
            ratio: "1:1",
            explanation: "Coconut oil gives a subtle tropical flavor.",
          },
        ],
      },
    ],
    steps: [
      "Soak rice and urad dal for 4 hours",
      "Grind into smooth batter",
      "Let ferment overnight",
      "Heat griddle and pour batter",
      "Cook until golden and crispy",
      "Fill with curry and serve hot",
    ],
    category: "Breakfast",
    state: "Tamil Nadu",
    benefits: "High in carbs, energizing for the day",
    equipment: ["Stovetop", "One-Pot", "Food Processor"],
    prepTime: 30,
    cookTime: 20,
    servings: 4,
    recommendedHotels: [
      { name: "Saravana Bhavan", location: "Chennai", rating: 4.5 },
      { name: "Buhari Hotel", location: "Chennai", rating: 4.3 },
    ],
  },
  {
    title: "Poha",
    description: "Flattened rice breakfast dish from Central India",
    image: "https://via.placeholder.com/300?text=Poha",
    ingredients: [
      {
        name: "Flattened rice",
        quantity: 2,
        unit: "cup",
        functionType: "Base",
        substitutes: [
          {
            name: "Cooked rice (regular)",
            ratio: "1:1",
            explanation:
              "Regular cooked rice can replace poha, just drain excess water first.",
          },
        ],
      },
      {
        name: "Potatoes",
        quantity: 2,
        unit: "piece",
        functionType: "Vegetable",
        substitutes: [
          {
            name: "Cauliflower",
            ratio: "1:1",
            explanation:
              "Cauliflower adds similar texture and complements the spices well.",
          },
        ],
      },
      {
        name: "Peanuts",
        quantity: 0.5,
        unit: "cup",
        functionType: "Protein",
        substitutes: [
          {
            name: "Cashews",
            ratio: "1:1",
            explanation: "Cashews provide similar crunch and nutty flavor.",
          },
        ],
      },
      {
        name: "Oil",
        quantity: 2,
        unit: "tbsp",
        functionType: "Fat",
        substitutes: [
          {
            name: "Ghee",
            ratio: "1:1",
            explanation: "Ghee adds richness and better flavor.",
          },
        ],
      },
      {
        name: "Turmeric",
        quantity: 0.5,
        unit: "tsp",
        functionType: "Seasoning",
        substitutes: [
          {
            name: "Saffron (pinch)",
            ratio: "1:5",
            explanation: "Saffron is more expensive but adds luxury and color.",
          },
        ],
      },
    ],
    steps: [
      "Rinse flattened rice lightly",
      "Boil and dice potatoes",
      "Roast peanuts in oil",
      "Add onions and chilies",
      "Mix in rice and potatoes",
      "Season with turmeric and lemon",
      "Serve warm",
    ],
    category: "Breakfast",
    state: "Madhya Pradesh",
    benefits: "Light, easy to digest breakfast",
    equipment: ["Stovetop", "Microwave"],
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    recommendedHotels: [
      { name: "Indian Coffee House", location: "Indore", rating: 4.0 },
    ],
  },

  // ==================== LUNCH ====================
  {
    title: "Chicken Tikka Masala",
    description: "Creamy tomato-based curry with marinated chicken pieces",
    image: "https://via.placeholder.com/300?text=Chicken+Tikka+Masala",
    ingredients: [
      {
        name: "Chicken breast",
        quantity: 500,
        unit: "g",
        functionType: "Protein",
        substitutes: [
          {
            name: "Paneer (cottage cheese)",
            ratio: "1:1",
            explanation:
              "Paneer is vegetarian alternative with similar texture when marinated.",
          },
          {
            name: "Tofu",
            ratio: "1:1",
            explanation:
              "Firm tofu absorbs marinades well and is vegan-friendly.",
          },
        ],
      },
      {
        name: "Cream",
        quantity: 200,
        unit: "ml",
        functionType: "Fat",
        substitutes: [
          {
            name: "Greek yogurt",
            ratio: "0.8:1",
            explanation:
              "Greek yogurt provides tanginess and creaminess, slightly different but excellent.",
          },
          {
            name: "Milk + Butter",
            ratio: "1:0.25",
            explanation:
              "Mix 1 cup milk with 1/4 cup butter to emulate cream texture.",
          },
        ],
      },
      {
        name: "Tomatoes",
        quantity: 3,
        unit: "piece",
        functionType: "Acid",
        substitutes: [
          {
            name: "Tomato paste",
            ratio: "1:3",
            explanation:
              "Use 1 tbsp tomato paste for 1 medium tomato; concentrate is stronger.",
          },
        ],
      },
      {
        name: "Garam masala",
        quantity: 1,
        unit: "tbsp",
        functionType: "Seasoning",
        substitutes: [
          {
            name: "Curry powder",
            ratio: "1:1",
            explanation:
              "Curry powder has similar warming spices, slightly different blend.",
          },
        ],
      },
    ],
    steps: [
      "Marinate chicken in yogurt and spices for 30 mins",
      "Grill or cook chicken until 70% done",
      "Make tomato paste base with oil and spices",
      "Add cooked chicken to curry base",
      "Simmer for 10 minutes",
      "Add cream and cook for 5 more minutes",
      "Serve with naan or rice",
    ],
    category: "Lunch",
    state: "Punjab",
    benefits: "High protein, rich in spices for flavor",
    equipment: ["Stovetop", "Oven", "One-Pot"],
    prepTime: 40,
    cookTime: 35,
    servings: 4,
    recommendedHotels: [
      { name: "Bukhara", location: "Connaught Place, Delhi", rating: 4.8 },
      { name: "Dhabha", location: "Amritsar", rating: 4.2 },
    ],
  },
  {
    title: "Biryani",
    description: "Aromatic rice dish with meat and fragrant spices",
    image: "https://via.placeholder.com/300?text=Biryani",
    ingredients: [
      {
        name: "Basmati rice",
        quantity: 2,
        unit: "cup",
        functionType: "Base",
        substitutes: [
          {
            name: "Jasmine rice",
            ratio: "1:1",
            explanation:
              "Similar aromatic quality and texture, slightly different fragrance.",
          },
        ],
      },
      {
        name: "Mutton or Chicken",
        quantity: 500,
        unit: "g",
        functionType: "Protein",
        substitutes: [
          {
            name: "Lamb",
            ratio: "1:1",
            explanation: "Lamb is tender and takes marinades well.",
          },
          {
            name: "Vegetables (mixed)",
            ratio: "1:1",
            explanation:
              "Veggie biryani with paneer and mixed vegetables is equally delicious.",
          },
        ],
      },
      {
        name: "Ghee",
        quantity: 100,
        unit: "ml",
        functionType: "Fat",
        substitutes: [
          {
            name: "Butter",
            ratio: "1:1",
            explanation:
              "Butter works but ghee is traditional for higher smoke point.",
          },
        ],
      },
      {
        name: "Yogurt",
        quantity: 200,
        unit: "ml",
        functionType: "Binder",
        substitutes: [
          {
            name: "Sour cream",
            ratio: "0.8:1",
            explanation:
              "Sour cream provides similar marinating effect with tanginess.",
          },
        ],
      },
    ],
    steps: [
      "Marinate meat in yogurt and spices for 1 hour",
      "Fry onions until golden",
      "Layer marinated meat in pot",
      "Parboil basmati rice",
      "Layer rice over meat",
      "Add saffron soaked milk",
      "Cook on high heat for 2 mins, then low for 45 mins",
      "Let rest for 5 minutes before serving",
    ],
    category: "Lunch",
    state: "Telangana",
    benefits: "Complete meal with rice and protein",
    equipment: ["Stovetop", "Pressure Cooker", "One-Pot"],
    prepTime: 60,
    cookTime: 50,
    servings: 6,
    recommendedHotels: [
      { name: "Shah Ghouse", location: "Hyderabad", rating: 4.6 },
      { name: "Haleem House", location: "Hyderabad", rating: 4.4 },
    ],
  },

  // ==================== DINNER ====================
  {
    title: "Dal Makhani",
    description: "Creamy lentil curry with butter and cream",
    image: "https://via.placeholder.com/300?text=Dal+Makhani",
    ingredients: [
      "Black lentils",
      "Kidney beans",
      "Tomatoes",
      "Cream",
      "Butter",
      "Onions",
      "Ginger",
      "Garlic",
      "Garam masala",
      "Cumin",
      "Turmeric",
    ],
    steps: [
      "Soak and boil lentils and beans for 20 mins",
      "Make tomato-onion paste",
      "Heat butter and add spices",
      "Add paste and cooked lentils",
      "Simmer for 30 minutes",
      "Add cream and butter",
      "Season and serve hot with naan",
    ],
    category: "Dinner",
    state: "Delhi",
    benefits: "High protein, vegetarian, comfort food",
    equipment: ["Stovetop", "One-Pot", "Pressure Cooker"],
    prepTime: 30,
    cookTime: 40,
    servings: 4,
    recommendedHotels: [
      { name: "Indian Accent", location: "Delhi", rating: 4.7 },
    ],
  },
  {
    title: "Butter Chicken",
    description: "Tender chicken in rich butter and tomato sauce",
    image: "https://via.placeholder.com/300?text=Butter+Chicken",
    ingredients: [
      "Chicken",
      "Yogurt",
      "Butter",
      "Cream",
      "Tomato puree",
      "Onions",
      "Ginger-garlic paste",
      "Kasuri methi",
      "Garam masala",
      "Chili powder",
    ],
    steps: [
      "Marinate chicken in yogurt and spices",
      "Roast or grill until cooked",
      "Fry onions and add ginger-garlic",
      "Add tomato puree and cook",
      "Add roasted chicken",
      "Pour butter and cream",
      "Simmer for 10 minutes",
      "Garnish with kasuri methi",
    ],
    category: "Dinner",
    equipment: ["Stovetop", "Oven", "One-Pot"],
    prepTime: 40,
    cookTime: 30,
    servings: 4,
    state: "Uttar Pradesh",
    benefits: "Rich, indulgent, perfect for special occasions",
    recommendedHotels: [
      { name: "Dum Pukht", location: "Lucknow", rating: 4.5 },
    ],
  },

  // ==================== DESSERT ====================
  {
    title: "Gulab Jamun",
    description: "Soft milk solids dumplings in rose-flavored syrup",
    image: "https://via.placeholder.com/300?text=Gulab+Jamun",
    ingredients: [
      "Milk powder",
      "Flour",
      "Sugar",
      "Rose water",
      "Cardamom",
      "Water",
      "Oil for deep frying",
      "Dry fruits",
    ],
    steps: [
      "Mix milk powder, flour, and baking powder",
      "Add condensed milk and knead dough",
      "Roll into balls",
      "Prepare sugar syrup with rose water",
      "Deep fry balls until golden",
      "Immediately dip in hot syrup",
      "Garnish with dry fruits",
      "Serve warm or cold",
    ],
    category: "Dessert",
    state: "Gujarat",
    benefits: "Sweet treat, traditional Indian dessert",
    equipment: ["Stovetop", "One-Pot"],
    prepTime: 20,
    cookTime: 25,
    servings: 6,
    recommendedHotels: [],
  },
  {
    title: "Kheer",
    description: "Creamy rice pudding with milk and dry fruits",
    image: "https://via.placeholder.com/300?text=Kheer",
    ingredients: [
      "Rice",
      "Milk",
      "Sugar",
      "Cardamom",
      "Raisins",
      "Cashews",
      "Almonds",
      "Dry fruits",
      "Ghee",
    ],
    equipment: ["Stovetop", "One-Pot", "Microwave"],
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    steps: [
      "Roast rice lightly in ghee",
      "Boil milk until reduced to 2/3",
      "Add roasted rice to milk",
      "Cook on low heat for 20 mins",
      "Add sugar and cardamom",
      "Fry dry fruits in ghee",
      "Add to kheer",
      "Serve hot or cold",
    ],
    category: "Dessert",
    state: "West Bengal",
    benefits: "Comforting, nutritious dessert",
    recommendedHotels: [],
  },

  // ==================== SNACKS ====================
  {
    title: "Samosa",
    description: "Triangular pastry filled with spiced potatoes",
    image: "https://via.placeholder.com/300?text=Samosa",
    ingredients: [
      "Refined flour",
      "Ghee",
      "Potatoes",
      "Peas",
      "Onions",
      "Ginger",
      "Green chilies",
      "Cumin seeds",
      "Garam masala",
      "Chaat masala",
      "Oil",
    ],
    steps: [
      "Make dough with flour and ghee",
      "Boil and mash potatoes with spices",
      "Roll dough and cut circles",
      "Fill with potato mixture",
      "Fold into triangle shape",
      "Deep fry until golden",
      "Serve with chutney",
    ],
    category: "Snacks",
    state: "Uttar Pradesh",
    benefits: "Popular street food, crispy and flavorful",
    equipment: ["Stovetop", "One-Pot"],
    prepTime: 30,
    cookTime: 20,
    servings: 12,
    recommendedHotels: [],
  },
  {
    title: "Pakora",
    description: "Crispy vegetable fritters in gram flour batter",
    image: "https://via.placeholder.com/300?text=Pakora",
    ingredients: [
      "Gram flour",
      "Onions",
      "Potatoes",
      "Ginger",
      "Green chilies",
      "Coriander",
      "Cumin",
      "Turmeric",
      "Chaat masala",
      "Water",
      "Oil for frying",
    ],
    steps: [
      "Make thick batter with gram flour and water",
      "Add all spices to batter",
      "Slice vegetables thinly",
      "Dip vegetables in batter",
      "Deep fry until golden and crispy",
      "Drain on paper towel",
      "Serve hot with mint chutney",
    ],
    equipment: ["Stovetop", "One-Pot"],
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    category: "Snacks",
    state: "Maharashtra",
    benefits: "Quick snack, pairs well with tea",
    recommendedHotels: [],
  },

  // ==================== REGIONAL CUISINES ====================
  {
    title: "Rogan Josh",
    description: "Aromatic curried meat dish from Kashmir",
    image: "https://via.placeholder.com/300?text=Rogan+Josh",
    ingredients: [
      "Lamb or goat",
      "Yogurt",
      "Tomatoes",
      "Onions",
      "Ginger-garlic",
      "Saffron",
      "Cardamom",
      "Cinnamon",
      "Bay leaves",
      "Rose petals",
      "Oil",
    ],
    steps: [
      "Brown meat in oil",
      "Add onions and ginger-garlic",
      "Add yogurt and tomatoes",
      "Cook until meat is tender",
      "Add saffron and spices",
      "Simmer for 30 minutes",
      "Garnish with rose petals",
      "Serve with rice or naan",
    ],
    category: "Non-Vegetarian",
    state: "Jammu and Kashmir",
    benefits: "Rich, aromatic, traditional Kashmiri dish",
    equipment: ["Stovetop", "One-Pot"],
    prepTime: 40,
    cookTime: 45,
    servings: 6,
    recommendedHotels: [
      { name: "Mughal Palace", location: "Srinagar", rating: 4.2 },
    ],
  },
  {
    title: "Idli",
    description: "Steamed rice cakes, South Indian specialty",
    image: "https://via.placeholder.com/300?text=Idli",
    ingredients: ["Rice", "Urad dal", "Fenugreek seeds", "Salt", "Water"],
    steps: [
      "Soak rice and urad dal separately for 4 hours",
      "Grind urad dal with fenugreek into fluffy batter",
      "Grind rice into smooth, fine batter",
      "Mix both batters and add salt",
      "Ferment for 8-12 hours",
      "Pour into idli molds",
      "Steam for 5-7 minutes",
      "Serve with sambar and chutney",
    ],
    category: "Breakfast",
    state: "Karnataka",
    benefits: "High protein, light, easy to digest",
    equipment: ["Stovetop", "One-Pot"],
    prepTime: 20,
    cookTime: 15,
    servings: 6,
    recommendedHotels: [{ name: "MTR", location: "Bangalore", rating: 4.4 }],
  },
  {
    title: "Chole Bhature",
    description: "Chickpea curry with deep-fried bread",
    image: "https://via.placeholder.com/300?text=Chole+Bhature",
    ingredients: [
      "Chickpeas",
      "Flour",
      "Yogurt",
      "Onions",
      "Tomatoes",
      "Ginger-garlic",
      "Cumin",
      "Coriander",
      "Garam masala",
      "Chaat masala",
      "Oil",
    ],
    steps: [
      "Soak and boil chickpeas until soft",
      "Make dough with flour, yogurt, and baking powder",
      "Prepare onion-tomato masala base",
      "Add cooked chickpeas and spices",
      "Simmer curry for 10 mins",
      "Deep fry bhature until golden",
      "Serve hot with pickles and onions",
    ],
    category: "Lunch",
    state: "Punjab",
    benefits: "Heavy, filling meal, full of protein",
    equipment: ["Stovetop", "One-Pot"],
    prepTime: 45,
    cookTime: 40,
    servings: 4,
    recommendedHotels: [{ name: "Karims", location: "Delhi", rating: 4.1 }],
  },
  {
    title: "Misal Pav",
    description: "Spicy curry with bread, Maharashtrian specialty",
    image: "https://via.placeholder.com/300?text=Misal+Pav",
    ingredients: [
      "Mixed sprouts",
      "Peas",
      "Potatoes",
      "Onions",
      "Tomatoes",
      "Ginger-garlic",
      "Chili powder",
      "Gram masala",
      "Pav bread",
      "Oil",
    ],
    steps: [
      "Boil sprouts and potatoes",
      "Make spicy curry base",
      "Add boiled vegetables",
      "Cook until well blended",
      "Toast pav in butter",
      "Top misal with onions and potato",
      "Serve hot with pav",
    ],
    category: "Breakfast",
    state: "Maharashtra",
    benefits: "Protein-rich, spicy, street food favorite",
    equipment: ["Stovetop", "One-Pot", "Microwave"],
    prepTime: 20,
    cookTime: 20,
    servings: 2,
    recommendedHotels: [{ name: "Misal House", location: "Pune", rating: 4.3 }],
  },
  {
    title: "Appam",
    description: "Fermented rice pancake with crispy edges",
    image: "https://via.placeholder.com/300?text=Appam",
    ingredients: ["Rice", "Yeast", "Sugar", "Coconut milk", "Salt", "Oil"],
    steps: [
      "Soak rice for 4 hours",
      "Grind rice into smooth batter",
      "Add yeast and sugar",
      "Let ferment for 4 hours",
      "Add coconut milk",
      "Heat appam mold",
      "Pour batter and cook until golden",
      "Serve with curry or jaggery",
    ],
    category: "Breakfast",
    state: "Kerala",
    benefits: "Light, crispy, traditionally South Indian",
    equipment: ["Stovetop", "One-Pot"],
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    recommendedHotels: [
      { name: "Appam Kitchen", location: "Kochi", rating: 4.0 },
    ],
  },
];

const seedDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not defined in .env file");
    }

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("📡 Connected to MongoDB");

    // Clear existing recipes
    await Recipe.deleteMany({});
    console.log("🗑️ Cleared existing recipes");

    // Insert dummy data
    const insertedRecipes = await Recipe.insertMany(dummyRecipes);
    console.log(`✅ Inserted ${insertedRecipes.length} recipes into database`);

    // Display summary
    console.log("\n📊 RECIPES SUMMARY:");
    console.log("==================");

    const categories = [...new Set(dummyRecipes.map((r) => r.category))];
    const states = [...new Set(dummyRecipes.map((r) => r.state))];

    console.log(`\n🍳 Categories (${categories.length}):`);
    categories.forEach((cat) => {
      const count = dummyRecipes.filter((r) => r.category === cat).length;
      console.log(`   - ${cat}: ${count} recipes`);
    });

    console.log(`\n🗺️ States (${states.length}):`);
    states.forEach((state) => {
      const count = dummyRecipes.filter((r) => r.state === state).length;
      console.log(`   - ${state}: ${count} recipes`);
    });

    console.log("\n✨ Database seeding completed successfully!");

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Seeding Error:", error.message);
    process.exit(1);
  }
};

// Run seeding
seedDB();
