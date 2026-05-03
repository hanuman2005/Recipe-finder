// ========== IMAGE PROCESSING JOB PROCESSOR ==========
// Background job processor for image optimization and manipulation
// Non-blocking: Images processed asynchronously after recipe upload/update
// Decouples image processing from HTTP response
//
// Architecture:
//   1. Controller calls queueImageProcessing() - returns immediately
//   2. Job added to Bull queue in Redis
//   3. Processor picks up job and processes image
//   4. Updates recipe.image with processed image path
//   5. If fails, retries with exponential backoff
//
// Operations Supported:
//   - optimize: Reduce file size without quality loss (lossless)
//   - compress: Reduce quality for smaller file size (lossy)
//   - resize: Scale to specific width/height dimensions
//   - generate-thumbnail: Create small preview image
//
// Job Data Format:
// {
//   recipeId: "ObjectId",
//   imagePath: "/uploads/image.jpg",
//   operation: "optimize" | "compress" | "resize" | "generate-thumbnail",
//   width?: 800, // For resize operation
//   height?: 600 // For resize operation
// }

// Import imageQueue from queueConfig (initialized with Redis connection)
const { imageQueue } = require("./queueConfig");

// Import Recipe model to update image path after processing
const Recipe = require("../models/Recipe");

// ========== MOCK IMAGE PROCESSING FUNCTIONS ==========
/**
 * Collection of mock image processing operations
 *
 * Production Implementation:
 *   - Use 'sharp' library for fast image processing (C++ bindings)
 *   - Use 'imagemin' for batch compression
 *   - Consider offloading to cloud services (AWS Lambda, CloudflareWorkers)
 *   - Use CDN with built-in image optimization (Cloudinary, Imgix)
 *
 * Current behavior:
 *   - All functions are mocked (log operation + simulate delay)
 *   - No actual image transformation happens
 *   - Returns fake processed path (useful for testing)
 */
const processImage = {
  /**
   * Optimize image (lossless compression)
   * Reduces file size while maintaining quality
   * Good for: Removing metadata, re-encoding to optimal format
   *
   * @param {String} imagePath - Path to source image
   * @returns {Promise<String>} Path to optimized image
   */
  optimize: async (imagePath) => {
    console.log(`🔧 Optimizing image: ${imagePath}`);
    // Simulate processing with 2 second delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return `${imagePath}.optimized`;
  },

  /**
   * Compress image (lossy compression)
   * Reduces both file size and quality
   * Good for: Web delivery, thumbnails, previews
   * Typical compression: 60-80% quality retention
   *
   * @param {String} imagePath - Path to source image
   * @returns {Promise<String>} Path to compressed image
   */
  compress: async (imagePath) => {
    console.log(`🗜️ Compressing image: ${imagePath}`);
    // Simulate processing with 1.5 second delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `${imagePath}.compressed`;
  },

  /**
   * Resize image to specific dimensions
   * Good for: Standardizing recipe card images, creating specific sizes for layout
   * Typical sizes:
   *   - Cards: 300x300px
   *   - Detail: 800x600px
   *   - Thumbnails: 150x150px
   *
   * @param {String} imagePath - Path to source image
   * @param {Number} width - Target width in pixels (default: 800)
   * @param {Number} height - Target height in pixels (default: 600)
   * @returns {Promise<String>} Path to resized image
   */
  resize: async (imagePath, width = 800, height = 600) => {
    console.log(`📐 Resizing image to ${width}x${height}: ${imagePath}`);
    // Simulate processing with 1.8 second delay
    await new Promise((resolve) => setTimeout(resolve, 1800));
    // Return path with dimensions appended to filename
    return `${imagePath}.${width}x${height}`;
  },

  /**
   * Generate thumbnail for preview
   * Creates smaller version for list views and galleries
   * Typical size: 150x150px
   *
   * @param {String} imagePath - Path to source image
   * @returns {Promise<String>} Path to thumbnail image
   */
  generateThumbnail: async (imagePath) => {
    console.log(`🎬 Generating thumbnail: ${imagePath}`);
    // Simulate processing with 1.2 second delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return `${imagePath}.thumb`;
  },
};

// ========== IMAGE JOB PROCESSOR ==========
/**
 * Bull queue processor for image jobs
 * Runs when job is pulled from queue (by Redis)
 *
 * Process:
 *   1. Extract job data: recipeId, imagePath, operation
 *   2. Validate all required fields present
 *   3. Log operation to console
 *   4. Execute appropriate image operation based on type
 *   5. Update recipe document with processed image path
 *   6. Return success response with metadata
 *
 * Error Handling:
 *   - Missing required fields - throw with message
 *   - Unknown operation type - throw with message
 *   - Recipe not found - throw with message
 *   - All throws trigger retry logic (attempts: 3, timeout: 60 seconds)
 *
 * Retry Strategy (exponential backoff):
 *   - Attempt 1: Immediate
 *   - Attempt 2: After 2 seconds
 *   - Attempt 3: After 4 seconds
 *   - If all fail: Job marked failed
 *
 * Database Update:
 *   - Uses Recipe.findByIdAndUpdate() with { new: true }
 *   - Updates recipe.image field with processed image path
 *   - If recipe not found, throws error (triggers retry)
 *
 * @param {Object} job - Bull job object with .data property
 * @returns {Promise<Object>} Success response with processing metadata
 * @throws {Error} If job fails (triggers retry)
 */
imageQueue.process(async (job) => {
  const { recipeId, imagePath, operation } = job.data;

  try {
    // Validate all required fields present
    if (!recipeId || !imagePath || !operation) {
      throw new Error(
        "Missing required fields: recipeId, imagePath, operation",
      );
    }

    // Log operation with emoji prefix
    console.log(`📸 Processing image for recipe ${recipeId}: ${operation}`);

    // Route to appropriate processing function based on operation type
    let processedImagePath;
    switch (operation) {
      case "optimize":
        processedImagePath = await processImage.optimize(imagePath);
        break;
      case "compress":
        processedImagePath = await processImage.compress(imagePath);
        break;
      case "resize":
        // Pass optional width/height from job data
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

    // Update recipe document with processed image path
    // { new: true } returns updated document
    const recipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { image: processedImagePath }, // Set image to processed path
      { new: true }, // Return updated document
    );

    // Check if recipe exists (deletion between queue add and process)
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    // Return success metadata for logging/auditing
    return {
      success: true,
      recipeId: recipeId,
      operation: operation,
      originalImage: imagePath,
      processedImage: processedImagePath,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Log error with emoji prefix
    console.error("❌ Image processing job failed:", error.message);
    // Re-throw to trigger retry logic
    throw error;
  }
});

// ========== QUEUE IMAGE PROCESSING HELPER FUNCTION ==========
/**
 * Queues an image processing job for background execution
 * Non-blocking: Returns immediately without waiting for processing
 *
 * Usage in controllers:
 *   queueImageProcessing(recipeId, '/uploads/photo.jpg', 'optimize')
 *   queueImageProcessing(recipeId, '/uploads/photo.jpg', 'resize', { width: 800, height: 600 })
 *   queueImageProcessing(recipeId, '/uploads/photo.jpg', 'generate-thumbnail')
 *
 * Retry Configuration:
 *   - attempts: 3 - Try up to 3 times before giving up (images less critical than emails)
 *   - backoff type: "exponential" - Wait increases exponentially (2s, 4s)
 *   - backoff delay: 2000ms - Base delay of 2 seconds
 *   - timeout: 60000ms - Maximum 60 seconds per attempt (plenty for image processing)
 *   - removeOnComplete: true - Delete job from queue after success
 *
 * Failure Handling:
 *   - If all 3 attempts fail, job moved to dead-letter queue
 *   - Can be retried manually or inspected via Bull dashboard
 *   - Not blocking: User sees success even if image processing fails
 *   - Fallback: Original unprocessed image still used if processing fails
 *
 * Performance Tips:
 *   - Image operations usually take 1-3 seconds
 *   - 60 second timeout provides breathing room for large files
 *   - Consider chunking very large images to separate jobs
 *   - Monitor queue depth in production (metrics/logging)
 *
 * @param {String} recipeId - MongoDB ID of recipe to update
 * @param {String} imagePath - File path to image (local or URL)
 * @param {String} operation - Type: "optimize" | "compress" | "resize" | "generate-thumbnail"
 * @param {Object} options - Additional options passed to job data
 * @returns {Promise<Object>} Bull job object with job.id
 *
 * @example
 *   // Queue image optimization
 *   await queueImageProcessing(
 *     '507f1f77bcf86cd799439011',
 *     '/uploads/biryani.jpg',
 *     'optimize'
 *   );
 *
 *   // Queue resize with specific dimensions
 *   await queueImageProcessing(
 *     '507f1f77bcf86cd799439011',
 *     '/uploads/biryani.jpg',
 *     'resize',
 *     { width: 800, height: 600 }
 *   );
 */
const queueImageProcessing = async (
  recipeId,
  imagePath,
  operation,
  options = {},
) => {
  // Default Bull queue configuration for image jobs
  const defaultQueueOptions = {
    attempts: 3, // Less retries than email (images less critical)
    backoff: {
      type: "exponential", // Exponential backoff strategy
      delay: 2000, // Start with 2 second delay
    },
    timeout: 60000, // 60 seconds max (large files might take time)
    removeOnComplete: true, // Clean up after success
  };

  // Queue job with all data and merged options
  // Spreads options so caller can override width, height, etc.
  return await imageQueue.add(
    {
      recipeId,
      imagePath,
      operation,
      ...options, // Additional options (width, height, etc)
    },
    defaultQueueOptions,
  );
};

// ========== EXPORT QUEUE AND FUNCTIONS ==========
// Exports for use in controllers and services
//
// Usage:
//   const { queueImageProcessing } = require('./jobs/imageProcessor');
//   queueImageProcessing(recipeId, imgPath, 'optimize');
module.exports = {
  imageQueue, // Image Bull queue instance (used in initializeQueues.js)
  queueImageProcessing, // Function to queue image jobs
  processImage, // Exported for testing or custom usage
};
