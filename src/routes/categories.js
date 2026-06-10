const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listCategories } = require('../db/queries/categories');

const router = express.Router();

// GET /api/categories
router.get('/', asyncHandler(async (req, res) => {
  const data = await listCategories();
  console.log(`[GET /api/categories] ${data.length} categories`);
  res.json({ success: true, count: data.length, data });
}));

module.exports = router;
