/**
 * Email Job Processor
 * Handles sending emails in background
 *
 * Job Data Format:
 * {
 *   to: "user@example.com",
 *   subject: "Welcome to Recipe-Finder",
 *   type: "welcome" | "comment" | "notification" | "password-reset",
 *   data: { userName, link, ... }
 * }
 */

const { emailQueue } = require("./queueConfig");

/**
 * Email Templates
 */
const emailTemplates = {
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

/**
 * Mock Email Sending Function
 * Replace with real email service (Nodemailer, SendGrid, etc.)
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

  // Simulate sending delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
};

/**
 * Process Email Jobs
 */
emailQueue.process(async (job) => {
  const { to, subject, type, data } = job.data;

  try {
    // Validate required fields
    if (!to || !type) {
      throw new Error("Missing required fields: to, type");
    }

    // Get email template
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

    // Send email
    const result = await sendEmailMock(
      to,
      emailContent.subject,
      emailContent.html,
    );

    if (!result) {
      throw new Error("Failed to send email");
    }

    // Return success
    return {
      success: true,
      email: to,
      type: type,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Email job failed:", error.message);
    throw error;
  }
});

/**
 * Helper function to queue email
 *
 * @param {string} to - Email address
 * @param {string} type - Email type (welcome, comment, etc.)
 * @param {object} data - Template data
 * @param {object} options - Queue options (attempts, delay, etc.)
 */
const queueEmail = async (to, type, data, options = {}) => {
  const defaultOptions = {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  };

  return await emailQueue.add(
    { to, type, data },
    { ...defaultOptions, ...options },
  );
};

module.exports = {
  emailQueue,
  queueEmail,
};
