const { query } = require('../pool');

// Columns returned for list/card views (plus the primary image url).
const LIST_COLUMNS = `
  v.id, v.slug, v.make, v.model, v.year, v.title, v.vehicle_class,
  v.reliability_score, v.luxury_score, v.daily_rate, v.currency,
  v.transmission, v.fuel_type, v.seats, v.color, v.body_type,
  v.location_city, v.location_country, v.availability_status,
  v.is_featured,
  c.code AS category_code, c.name AS category_name,
  TRIM(E' \t\n\r' FROM img.url) AS image_url
`;

// LEFT JOIN the single primary image (uq_vehicle_images_one_primary guarantees at most one).
const LIST_FROM = `
  FROM rental_vehicles v
  JOIN vehicle_categories c ON c.id = v.category_id
  LEFT JOIN vehicle_images img ON img.vehicle_id = v.id AND img.is_primary = TRUE
`;

/**
 * List vehicles with optional filters.
 * filters: { category, vehicleClass, city, q, featured, available, sort, limit, offset }
 */
async function listVehicles(filters = {}) {
  const conditions = ['v.is_active = TRUE'];
  const params = [];

  // Default to only available cars unless explicitly disabled.
  if (filters.available !== false) {
    conditions.push(`v.availability_status = 'available'`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`c.code = $${params.length}`);
  }
  if (filters.vehicleClass) {
    params.push(filters.vehicleClass);
    conditions.push(`v.vehicle_class = $${params.length}`);
  }
  if (filters.city) {
    params.push(filters.city);
    conditions.push(`v.location_city ILIKE $${params.length}`);
  }
  if (filters.featured === true) {
    conditions.push('v.is_featured = TRUE');
  }
  if (filters.q) {
    params.push(filters.q);
    conditions.push(`v.search_vector @@ websearch_to_tsquery('english', $${params.length})`);
  }

  const sortMap = {
    price_asc: 'v.daily_rate ASC',
    price_desc: 'v.daily_rate DESC',
    newest: 'v.created_at DESC',
  };
  const orderBy = sortMap[filters.sort] || 'v.is_featured DESC, v.created_at DESC';

  const limit = Math.min(parseInt(filters.limit, 10) || 20, 100);
  const offset = parseInt(filters.offset, 10) || 0;
  params.push(limit, offset);

  const sql = `
    SELECT ${LIST_COLUMNS}
    ${LIST_FROM}
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  const { rows } = await query(sql, params);
  return rows;
}

// Top Picks: active + featured, newest first (uses idx_rental_vehicles_featured).
async function getFeatured(limit = 8) {
  const sql = `
    SELECT ${LIST_COLUMNS}, v.description
    ${LIST_FROM}
    WHERE v.is_active = TRUE AND v.is_featured = TRUE
    ORDER BY v.created_at DESC
    LIMIT $1
  `;
  const { rows } = await query(sql, [Math.min(parseInt(limit, 10) || 8, 50)]);
  return rows;
}

// Distinct vehicle makes (brand strip on the landing page).
async function listMakes() {
  const sql = `
    SELECT DISTINCT v.make
    FROM rental_vehicles v
    WHERE v.is_active = TRUE
    ORDER BY v.make
  `;
  const { rows } = await query(sql);
  return rows.map((r) => r.make);
}

// Full detail for one vehicle: all fields + category + images[] + features[].
async function getVehicleBySlug(slug) {
  const vehicleSql = `
    SELECT v.*, c.code AS category_code, c.name AS category_name
    FROM rental_vehicles v
    JOIN vehicle_categories c ON c.id = v.category_id
    WHERE v.slug = $1 AND v.is_active = TRUE
  `;
  const { rows } = await query(vehicleSql, [slug]);
  if (rows.length === 0) return null;
  const vehicle = rows[0];
  delete vehicle.search_vector; // internal tsvector, not for the client

  const images = await query(
    `SELECT id, TRIM(E' \t\n\r' FROM url) AS url, alt_text, sort_order, is_primary
     FROM vehicle_images WHERE vehicle_id = $1
     ORDER BY is_primary DESC, sort_order ASC`,
    [vehicle.id]
  );
  const features = await query(
    `SELECT f.code, f.label, f.icon
     FROM vehicle_feature_map m
     JOIN features f ON f.id = m.feature_id
     WHERE m.vehicle_id = $1
     ORDER BY f.label`,
    [vehicle.id]
  );

  return { ...vehicle, images: images.rows, features: features.rows };
}

module.exports = { listVehicles, getFeatured, listMakes, getVehicleBySlug };
