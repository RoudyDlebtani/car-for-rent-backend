const { query } = require('../pool');

// Categories with a live count of their available vehicles (for the "Wide range" section).
async function listCategories() {
  const sql = `
    SELECT c.id, c.code, c.name, c.description,
           COUNT(v.id) FILTER (
             WHERE v.is_active AND v.availability_status = 'available'
           ) AS available_count
    FROM vehicle_categories c
    LEFT JOIN rental_vehicles v ON v.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `;
  const { rows } = await query(sql);
  return rows;
}

module.exports = { listCategories };
