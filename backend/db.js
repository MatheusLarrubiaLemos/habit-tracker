// Banco de dados local em SQLite: um único arquivo em backend/data/habits.db
// Para migrar para outro PC/mini computador, basta copiar a pasta "data".
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'habits.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS habits (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    color      TEXT NOT NULL DEFAULT '#10b981',
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS habit_marks (
    habit_id    INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    marked_date TEXT NOT NULL,             -- "AAAA-MM-DD"
    PRIMARY KEY (habit_id, marked_date)
  );
  CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
`);

/** Segredo do login (JWT): usa o do .env ou gera um e guarda em data/jwt-secret.txt */
function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const file = path.join(DATA_DIR, 'jwt-secret.txt');
  if (!fs.existsSync(file)) fs.writeFileSync(file, require('crypto').randomBytes(48).toString('hex'));
  return fs.readFileSync(file, 'utf8').trim();
}

module.exports = { db, DATA_DIR, JWT_SECRET: getJwtSecret() };
