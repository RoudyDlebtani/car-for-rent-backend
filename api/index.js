// Vercel serverless entry point — re-exports the Express app.
// All routes are rewritten here by vercel.json; Express sees the original URL.
module.exports = require('../src/server');
