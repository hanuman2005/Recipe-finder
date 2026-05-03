/**
 * UTILITY: Async Error Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates the need for try-catch blocks in every controller function
 *
 * Usage:
 * const getRecipes = catchAsync(async (req, res) => {
 *   const recipes = await Recipe.find();
 *   res.json(recipes);
 * });
 *
 * Any errors thrown in the async function will be caught and passed to next(error)
 * which triggers the error handling middleware in app.js
 *
 * @param {Function} fn - Async function (route handler)
 * @returns {Function} Wrapped function that catches errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    // Call the async function and catch any errors
    // If error occurs, pass it to Express error handler via next(error)
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
