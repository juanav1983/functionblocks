// ============================================================
//  db.js — Pool de conexión a Supabase / PostgreSQL
//  Usa el paquete 'pg' (npm install pg)
// ============================================================
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // Supabase requiere SSL en producción
    : false,                           // Local sin SSL
});

pool.on('connect', () => {
  console.log('✅ Conexión a Supabase / PostgreSQL establecida');
});

pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err.message);
});

module.exports = { pool };
