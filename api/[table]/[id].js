const { getPool, getTableConfig, prepareValue } = require('../_db');

module.exports = async (req, res) => {
  const { table, id } = req.query;
  const cfg = getTableConfig(table);
  if (!cfg) {
    res.status(404).json({ error: 'Tabla desconocida' });
    return;
  }
  const pool = getPool();

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const cols = cfg.columns.filter((c) => c in body);
    if (!cols.length) {
      res.status(400).json({ error: 'Sin datos para actualizar' });
      return;
    }
    const values = cols.map((c) => prepareValue(c, body[c], cfg));
    const setClause = cols
      .map((c, i) => `${c} = $${i + 1}${cfg.jsonbColumns.includes(c) ? '::jsonb' : ''}`)
      .join(',');
    try {
      const { rows } = await pool.query(
        `UPDATE ${table} SET ${setClause} WHERE id = $${cols.length + 1} RETURNING *`,
        [...values, id]
      );
      res.status(200).json(rows[0] || null);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
};
