const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

async function checkCollections() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/recipe-finder",
    );

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log("\n" + "=".repeat(60));
    console.log("📊 DATABASE COLLECTION DOCUMENT COUNTS");
    console.log("=".repeat(60) + "\n");

    let totalDocs = 0;
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      totalDocs += count;
      console.log(`  📋 ${collection.name.padEnd(30)} : ${count} documents`);
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📈 TOTAL DOCUMENTS: ${totalDocs}`);
    console.log("=".repeat(60) + "\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkCollections();
