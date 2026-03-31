/**
 * Image Processing Job Processor
 * Handles image optimization, compression, resizing in background
 *
 * Job Data Format:
 * {
 *   recipeId: "ObjectId",
 *   imagePath: "/uploads/image.jpg",
 *   operation: "optimize" | "compress" | "resize" | "generate-thumbnail"
 * }
 */

const { imageQueue } = require("./queueConfig");
const Recipe = require("../models/Recipe");

/**
 * Mock Image Processing Functions
 * Replace with real libraries: sharp, imagemin, etc.
 */
const processImage = {
  // Optimize image (reduce file size without quality loss)
  optimize: async (imagePath) => {
    console.log(`🔧 Optimizing image: ${imagePath}`);
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return `${imagePath}.optimized`;
  },

  // Compress image (reduce quality for smaller file size)
  compress: async (imagePath) => {
    console.log(`🗜️ Compressing image: ${imagePath}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `${imagePath}.compressed`;
  },

  // Resize image to specific dimensions
  resize: async (imagePath, width = 800, height = 600) => {
    console.log(`📐 Resizing image to ${width}x${height}: ${imagePath}`);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return `${imagePath}.${width}x${height}`;
  },

  // Generate thumbnail for preview
  generateThumbnail: async (imagePath) => {
    console.log(`🎬 Generating thumbnail: ${imagePath}`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return `${imagePath}.thumb`;
  },
};

/**
 * Process Image Jobs
 */
imageQueue.process(async (job) => {
  const { recipeId, imagePath, operation } = job.data;

  try {
    // Validate required fields
    if (!recipeId || !imagePath || !operation) {
      throw new Error(
        "Missing required fields: recipeId, imagePath, operation",
      );
    }

    console.log(`📸 Processing image for recipe ${recipeId}: ${operation}`);

    // Process image based on operation type
    let processedImagePath;
    switch (operation) {
      case "optimize":
        processedImagePath = await processImage.optimize(imagePath);
        break;
      case "compress":
        processedImagePath = await processImage.compress(imagePath);
        break;
      case "resize":
        processedImagePath = await processImage.resize(
          imagePath,
          job.data.width,
          job.data.height,
        );
        break;
      case "generate-thumbnail":
        processedImagePath = await processImage.generateThumbnail(imagePath);
        break;
      default:
        throw new Error(`Unknown image operation: ${operation}`);
    }

    // Update recipe with processed image path
    const recipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { image: processedImagePath },
      { new: true },
    );

    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    // Return success
    return {
      success: true,
      recipeId: recipeId,
      operation: operation,
      originalImage: imagePath,
      processedImage: processedImagePath,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Image processing job failed:", error.message);
    throw error;
  }
});

/**
 * Helper function to queue image processing
 *
 * @param {string} recipeId - Recipe ID
 * @param {string} imagePath - Path to image
 * @param {string} operation - Operation type
 * @param {object} options - Additional options (width, height, etc.)
 */
const queueImageProcessing = async (
  recipeId,
  imagePath,
  operation,
  options = {},
) => {
  const defaultQueueOptions = {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    timeout: 60000, // 60 seconds for image processing
    removeOnComplete: true,
  };

  return await imageQueue.add(
    {
      recipeId,
      imagePath,
      operation,
      ...options,
    },
    defaultQueueOptions,
  );
};

module.exports = {
  imageQueue,
  queueImageProcessing,
  processImage,
};
