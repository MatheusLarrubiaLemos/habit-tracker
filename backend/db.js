const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL não definido — configure no arquivo .env (veja .env.example)');
}

// SSL só quando o banco é remoto (Railway etc.). Postgres local normalmente não usa SSL.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

/** Cria as tabelas se ainda não existirem. */
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS habits (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#10b981',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS habit_marks (
      id          SERIAL PRIMARY KEY,
      habit_id    INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      marked_date DATE NOT NULL,
      UNIQUE (habit_id, marked_date)
    );
  `);
}

module.exports = pool;
module.exports.initSchema = initSchema;
