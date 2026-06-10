const { query } = require('../pool');

// A user's saved favorites, joined to vehicle card info + primary image.
async function listForUser(userId) {
  const sql = `
    SELECT f.saved_at, f.notes,
           v.id, v.slug, v.make, v.model, v.year, v.title,
           v.vehicle_class, v.daily_rate, v.currency, v.location_city,
           v.availability_status,
           img.url AS image_url
    FROM saved_favorites f
    JOIN rental_vehicles v ON v.id = f.vehicle_id
    LEFT JOIN vehicle_images img ON img.vehicle_id = v.id AND img.is_primary = TRUE
    WHERE f.user_id = $1
    ORDER BY f.saved_at DESC
  `;
  const { rows } = await query(sql, [userId]);
  return rows;
}

// Add (idempotent): re-saving updates the notes instead of erroring.
async function addFavorite(userId, vehicleId, notes) {
  const { rows } = await query(
    `INSERT INTO saved_favorites (user_id, vehicle_id, notes)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, vehicle_id)
     DO UPDATE SET notes = EXCLUDED.notes
     RETURNING user_id, vehicle_id, saved_at, notes`,
    [userId, vehicleId, notes || null]
  );
  return rows[0];
}

async function removeFavorite(userId, vehicleId) {
  const { rowCount } = await query(
    `DELETE FROM saved_favorites WHERE user_id = $1 AND vehicle_id = $2`,
    [userId, vehicleId]
  );
  return rowCount > 0;
}

module.exports = { listForUser, addFavorite, removeFavorite };
