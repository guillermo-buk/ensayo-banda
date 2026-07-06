const { getPool, getTableConfig, prepareValue } = require('../_db');

module.exports = async (req, res) => {
  const { table } = req.query;
  const cfg = getTableConfig(table);
  if (!cfg) {
    res.status(404).json({ error: 'Tabla desconocida' });
    return;
  }
  const pool = getPool();

  if (req.method === 'GET') {
    const orderParam = req.query.order;
    const orderCol = cfg.orderColumns.includes(orderParam) ? orderParam : cfg.defaultOrder;
    const asc = req.query.asc !== 'false';
    try {
      const { rows } = await pool.query(
        `SELECT * FROM ${table} ORDER BY ${orderCol} ${asc ? 'ASC' : 'DESC'}`
      );
      res.status(200).json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const cols = cfg.columns.filter((c) => c in body);
    if (!cols.length) {
      res.status(400).json({ error: 'Sin datos para insertar' });
      return;
    }
    const values = cols.map((c) => prepareValue(c, body[c], cfg));
    const placeholders = cols.map((c, i) => (cfg.jsonbColumns.includes(c) ? `$${i + 1}::jsonb` : `$${i + 1}`));
    try {
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
        values
      );
      res.status(200).json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
};
