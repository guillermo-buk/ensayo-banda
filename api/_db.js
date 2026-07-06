const { Pool } = require('pg');

// Un solo Pool reutilizado entre invocaciones "warm" de la función serverless.
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return pool;
}

const TABLES = {
  canciones: {
    columns: ['titulo', 'tono', 'bpm', 'lista', 'bloques', 'notas', 'pedales', 'bkit', 'nota_general', 'tabs'],
    jsonbColumns: ['bloques', 'notas', 'pedales', 'bkit', 'tabs'],
    orderColumns: ['created_at', 'titulo'],
    defaultOrder: 'created_at',
  },
  sesiones: {
    columns: ['fecha', 'titulo', 'link1', 'link2', 'link3', 'notas'],
    jsonbColumns: [],
    orderColumns: ['created_at', 'fecha'],
    defaultOrder: 'created_at',
  },
  pendientes: {
    columns: ['texto', 'quien', 'done'],
    jsonbColumns: [],
    orderColumns: ['created_at'],
    defaultOrder: 'created_at',
  },
};

function getTableConfig(table) {
  return Object.prototype.hasOwnProperty.call(TABLES, table) ? TABLES[table] : null;
}

function prepareValue(col, value, cfg) {
  if (cfg.jsonbColumns.includes(col)) {
    if (value === undefined || value === null) return null;
    return JSON.stringify(value);
  }
  return value;
}

module.exports = { getPool, getTableConfig, prepareValue };
