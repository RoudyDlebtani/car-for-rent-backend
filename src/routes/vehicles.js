const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listVehicles, getFeatured, listMakes, getVehicleBySlug } = require('../db/queries/vehicles');

const router = express.Router();

// Parse "true"/"false" query strings into booleans (undefined if absent).
function parseBool(value) {
  if (value === undefined) return undefined;
  return String(value).toLowerCase() === 'true';
}

// GET /api/vehicles — filterable catalog
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    category: req.query.category,
    vehicleClass: req.query.class,
    city: req.query.city,
    q: req.query.q,
    featured: parseBool(req.query.featured),
    available: parseBool(req.query.available),   // undefined -> defaults to only-available
    sort: req.query.sort,
    limit: req.query.limit,
    offset: req.query.offset,
  };
  const data = await listVehicles(filters);
  console.log(`[GET /api/vehicles] ${data.length} result(s)`, req.query);
  res.json({ success: true, count: data.length, data });
}));

// GET /api/vehicles/featured — Top Picks (declared before /:slug so it isn't captured as a slug)
router.get('/featured', asyncHandler(async (req, res) => {
  const data = await getFeatured(req.query.limit);
  console.log(`[GET /api/vehicles/featured] ${data.length} top pick(s)`);
  res.json({ success: true, count: data.length, data });
}));

// GET /api/vehicles/makes — distinct makes for the brand strip (before /:slug so it isn't captured)
router.get('/makes', asyncHandler(async (req, res) => {
  const data = await listMakes();
  console.log(`[GET /api/vehicles/makes] ${data.length} make(s)`);
  res.json({ success: true, count: data.length, data });
}));

// GET /api/vehicles/:slug — full detail
router.get('/:slug', asyncHandler(async (req, res) => {
  const vehicle = await getVehicleBySlug(req.params.slug);
  if (!vehicle) {
    console.log('[GET /api/vehicles/:slug] Not found:', req.params.slug);
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  console.log('[GET /api/vehicles/:slug]', vehicle.make, vehicle.model);
  res.json({ success: true, data: vehicle });
}));

module.exports = router;
