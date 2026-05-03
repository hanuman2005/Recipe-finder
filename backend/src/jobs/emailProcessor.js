// ========== EMAIL JOB PROCESSOR ==========
// Background job processor for sending emails asynchronously
// Non-blocking: Emails are queued and processed in background
// Decouples email sending from HTTP response (request completes before email is sent)
//
// Architecture:
//   1. Controller calls queueEmail() - returns immediately
//   2. Job added to Bull queue in Redis
//   3. Processor picks up job and sends email
//   4. If fails, retries with exponential backoff
//   5. On success, removes from queue
//
// Job Data Format:
// {
//   to: "user@example.com",
//   subject: "Welcome to Recipe-Finder",
//   type: "welcome" | "comment" | "notification" | "password-reset",
//   data: { userName, link, ... }
// }

// Import emailQueue from queueConfig (initialized with Redis connection)
const { emailQueue } = require("./queueConfig");

// ========== EMAIL TEMPLATES OBJECT ==========
// Collection of template functions for different email types
// Each function returns { subject, html } with formatted content
// Uses process.env.FRONTEND_URL for dynamic links (deployed app URL)
//
// Security Note: All user data should be HTML-escaped to prevent injection
// (Currently not escaped - should use libraries like xss or DOMPurify in production)

const emailTemplates = {
  /**
   * Welcome email template
   * Sent to user after successful registration
   *
   * @param {String} userName - User's display name
   * @returns {Object} { subject, html }
   */
  welcome: (userName) => ({
    subject: "Welcome to Recipe-Finder! 👨‍🍳",
    html: `
      <h2>Welcome, ${userName}!</h2>
      <p>Thanks for joining Recipe-Finder - your personal recipe collection platform.</p>
      <p>Start exploring recipes and building your collection today!</p>
      <a href="${process.env.FRONTEND_URL}/explore" style="background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Explore Recipes
      </a>
    `,
  }),

  /**
   * Comment notification template
   * Sent to recipe creator when someone comments on their recipe
   *
   * @param {String} recipeTitle - Title of recipe commented on
   * @param {String} commenterName - Name of user who commented
   * @returns {Object} { subject, html }
   */
  comment: (recipeTitle, commenterName) => ({
    subject: `New comment on your recipe: ${recipeTitle}`,
    html: `
      <h2>New Comment!</h2>
      <p><strong>${commenterName}</strong> commented on your recipe <strong>"${recipeTitle}"</strong>.</p>
      <p>Check out what they said!</p>
      <a href="${process.env.FRONTEND_URL}/recipes/${recipeTitle}" style="background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Comment
      </a>
    `,
  }),

  /**
   * Password reset template
   * Sent to user when password reset requested (not implemented yet)
   * Link expires in 1 hour (time validation should happen on backend)
   *
   * @param {String} resetLink - Full password reset link with token
   * @returns {Object} { subject, html }
   */
  passwordReset: (resetLink) => ({
    subject: "Reset Your Recipe-Finder Password 🔐",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p><em>If you didn't request this, ignore this email.</em></p>
    `,
  }),

  /**
   * Generic notification template
   * Flexible template for miscellaneous notifications
   *
   * @param {String} message - Notification message content
   * @param {String} link - CTA link URL
   * @returns {Object} { subject, html }
   */
  notification: (message, link) => ({
    subject: "Recipe-Finder Notification 📬",
    html: `
      <h2>Notification</h2>
      <p>${message}</p>
      <a href="${link}" style="background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Details
      </a>
    `,
  }),
};

// ========== MOCK EMAIL SENDING FUNCTION ==========
/**
 * Simulates email sending (currently mocked for development)
 *
 * Production Implementation:
 *   - Replace with Nodemailer (SMTP) for self-hosted email
 *   - Or SendGrid, AWS SES, Mailgun for cloud services
 *   - Add email verification before sending
 *   - Implement unsubscribe links for compliance
 *
 * @param {String} to - Recipient email address
 * @param {String} subject - Email subject line
 * @param {String} html - Email HTML content
 * @returns {Promise<Boolean>} true if successful
 *
 * Current behavior:
 *   - Logs email details to console with emoji prefix (📧)
 *   - Shows: to, subject, content preview (first 100 chars)
 *   - Simulates 1 second delay (async operation)
 *   - Always returns true (no actual failures in mock)
 */
const sendEmailMock = async (to, subject, html) => {
  // In production, use Nodemailer or SendGrid
  // For now, just log it
  console.log(`
    📧 EMAIL SENT
    To: ${to}
    Subject: ${subject}
    Content: ${html.substring(0, 100)}...
  `);

  // Simulate network delay of email sending
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
};

// ========== EMAIL JOB PROCESSOR ==========
/**
 * Bull queue processor for email jobs
 * Runs when job is pulled from queue (by Redis)
 *
 * Process:
 *   1. Extract job data: to, subject, type, data
 *   2. Validate required fields or throw error
 *   3. Select appropriate template based on type
 *   4. Call sendEmailMock with formatted content
 *   5. Return success response with metadata
 *
 * Error Handling:
 *   - Missing required fields (to, type) - throw with message
 *   - Unknown email type - throw with message
 *   - Failed send - throw with message
 *   - All throws trigger retry logic (attempts: 5)
 *
 * Retry Strategy (exponential backoff):
 *   - Attempt 1: Immediate
 *   - Attempt 2: After 2 seconds
 *   - Attempt 3: After 4 seconds
 *   - Attempt 4: After 8 seconds
 *   - Attempt 5: After 16 seconds
 *   - If all fail: Job marked failed, stored in deadletter
 *
 * @param {Object} job - Bull job object with .data property
 * @returns {Promise<Object>} Success response {success, email, type, timestamp}
 * @throws {Error} If job fails (triggers retry)
 */
emailQueue.process(async (job) => {
  const { to, subject, type, data } = job.data;

  try {
    // Validate required fields exist
    if (!to || !type) {
      throw new Error("Missing required fields: to, type");
    }

    // Select email template based on type
    let emailContent;
    switch (type) {
      case "welcome":
        emailContent = emailTemplates.welcome(data.userName);
        break;
      case "comment":
        emailContent = emailTemplates.comment(
          data.recipeTitle,
          data.commenterName,
        );
        break;
      case "password-reset":
        emailContent = emailTemplates.passwordReset(data.resetLink);
        break;
      case "notification":
        emailContent = emailTemplates.notification(data.message, data.link);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Send email (currently mocked)
    const result = await sendEmailMock(
      to,
      emailContent.subject,
      emailContent.html,
    );

    // Check if send was successful
    if (!result) {
      throw new Error("Failed to send email");
    }

    // Return success metadata
    return {
      success: true,
      email: to,
      type: type,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Log error with emoji prefix
    console.error("❌ Email job failed:", error.message);
    // Re-throw to trigger retry logic
    throw error;
  }
});

// ========== QUEUE EMAIL HELPER FUNCTION ==========
/**
 * Queues an email job for background processing
 * Non-blocking: Returns immediately without waiting for email send
 *
 * Usage in controllers:
 *   queueEmail(user.email, 'welcome', { userName: user.name })
 *   queueEmail(user.email, 'comment', { recipeTitle, commenterName })
 *
 * Retry Configuration:
 *   - attempts: 5 - Try up to 5 times before giving up
 *   - backoff type: "exponential" - Wait increases exponentially (2s, 4s, 8s, 16s)
 *   - backoff delay: 2000ms - Base delay of 2 seconds
 *   - removeOnComplete: true - Delete job from queue after success (saves Redis memory)
 *
 * Failure Handling:
 *   - If all 5 attempts fail, job moved to dead-letter queue
 *   - Can be manually inspected via Bull dashboard
 *   - Not critical - email sent on best-effort basis, doesn't block user
 *
 * @param {String} to - Recipient email address
 * @param {String} type - Email type (welcome, comment, password-reset, notification)
 * @param {Object} data - Template-specific data (depends on type)
 * @param {Object} options - Optional Bull queue options (overrides defaults)
 * @returns {Promise<Object>} Job object with job.id
 *
 * @example
 *   // Queue welcome email
 *   await queueEmail(user.email, 'welcome', { userName: user.name });
 *
 *   // Queue comment notification with custom retry logic
 *   await queueEmail(
 *     user.email,
 *     'comment',
 *     { recipeTitle: "Biryani", commenterName: "John" },
 *     { attempts: 3 } // Override to 3 attempts instead of 5
 *   );
 */
const queueEmail = async (to, type, data, options = {}) => {
  // Default retry and queue configuration
  // Provides resilience for transient failures
  const defaultOptions = {
    attempts: 5, // Retry up to 5 times
    backoff: {
      type: "exponential", // Exponential backoff strategy
      delay: 2000, // Start with 2 second delay between retries
    },
    removeOnComplete: true, // Clean up job from queue after success
  };

  // Merge user options with defaults (user options override)
  // Queue job with merged configuration
  return await emailQueue.add(
    { to, type, data }, // Job data
    { ...defaultOptions, ...options }, // Merged options
  );
};

// ========== EXPORT QUEUE AND FUNCTION ==========
// Exports for use in controllers and services
//
// Usage:
//   const { queueEmail } = require('./jobs/emailProcessor');
//   queueEmail(email, 'welcome', { userName: 'John' });
module.exports = {
  emailQueue, // Email Bull queue instance (used in initializeQueues.js)
  queueEmail, // Function to queue email jobs
};
