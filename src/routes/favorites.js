const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');
const { listForUser, addFavorite, removeFavorite } = require('../db/queries/favorites');

const router = express.Router();

// Every favorites route requires a logged-in user.
router.use(requireAuth);

// GET /api/favorites
router.get('/', asyncHandler(async (req, res) => {
  const data = await listForUser(req.user.id);
  console.log(`[GET /api/favorites] ${data.length} saved for ${req.user.email}`);
  res.json({ success: true, count: data.length, data });
}));

// POST /api/favorites/:vehicleId   body: { notes? }
router.post('/:vehicleId', writeLimiter, asyncHandler(async (req, res) => {
  const fav = await addFavorite(req.user.id, req.params.vehicleId, req.body && req.body.notes);
  console.log('[POST /api/favorites] saved', req.params.vehicleId, 'for', req.user.email);
  res.status(201).json({ success: true, data: fav });
}));

// DELETE /api/favorites/:vehicleId
router.delete('/:vehicleId', writeLimiter, asyncHandler(async (req, res) => {
  const removed = await removeFavorite(req.user.id, req.params.vehicleId);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Favorite not found' });
  }
  console.log('[DELETE /api/favorites] removed', req.params.vehicleId, 'for', req.user.email);
  res.json({ success: true, message: 'Removed from favorites' });
}));

module.exports = router;
