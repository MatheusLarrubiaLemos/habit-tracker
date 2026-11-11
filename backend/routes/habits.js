const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db, JWT_SECRET } = require('../db');

// Middleware: verifica se o token é válido
router.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sem autorização' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(req.user.id)) throw new Error();
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada, entre de novo' });
  }
});

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const cleanName = (n) => String(n ?? '').trim().slice(0, 60);
const findHabit = (id, userId) => db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(id, userId);

function listHabits(userId) {
  const habits = db.prepare('SELECT id, name, color, position FROM habits WHERE user_id = ? ORDER BY position, id').all(userId);
  const marks = db.prepare(`
    SELECT m.habit_id, m.marked_date FROM habit_marks m
    JOIN habits h ON h.id = m.habit_id WHERE h.user_id = ?`).all(userId);
  const byHabit = {};
  marks.forEach(m => (byHabit[m.habit_id] ||= []).push(m.marked_date));
  return habits.map(h => ({ ...h, marks: byHabit[h.id] || [] }));
}

// Listar hábitos (marks = lista de "AAAA-MM-DD")
router.get('/', (req, res) => res.json(listHabits(req.user.id)));

// Criar hábito
router.post('/', (req, res) => {
  const name = cleanName(req.body?.name);
  const color = COLOR_RE.test(req.body?.color) ? req.body.color : '#10b981';
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const pos = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM habits WHERE user_id = ?').get(req.user.id).p;
  const info = db.prepare('INSERT INTO habits (user_id, name, color, position) VALUES (?, ?, ?, ?)')
    .run(req.user.id, name, color, pos);
  res.json({ id: Number(info.lastInsertRowid), name, color, position: pos, marks: [] });
});

// Importar vários hábitos de uma vez (usado para subir os dados que estavam só no aparelho)
router.post('/import', (req, res) => {
  const list = Array.isArray(req.body?.habits) ? req.body.habits : [];
  const insHabit = db.prepare('INSERT INTO habits (user_id, name, color, position) VALUES (?, ?, ?, ?)');
  const insMark = db.prepare('INSERT OR IGNORE INTO habit_marks (habit_id, marked_date) VALUES (?, ?)');
  let pos = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM habits WHERE user_id = ?').get(req.user.id).p;
  db.transaction(() => {
    for (const h of list) {
      const name = cleanName(h.name);
      if (!name) continue;
      const color = COLOR_RE.test(h.color) ? h.color : '#10b981';
      const id = Number(insHabit.run(req.user.id, name, color, pos++).lastInsertRowid);
      (Array.isArray(h.marks) ? h.marks : []).filter(d => DATE_RE.test(d)).forEach(d => insMark.run(id, d));
    }
  })();
  res.json(listHabits(req.user.id));
});

// Editar hábito (nome e/ou cor)
router.patch('/:id', (req, res) => {
  const h = findHabit(req.params.id, req.user.id);
  if (!h) return res.status(404).json({ error: 'Hábito não encontrado' });
  const name = req.body?.name !== undefined ? cleanName(req.body.name) : h.name;
  const color = COLOR_RE.test(req.body?.color) ? req.body.color : h.color;
  if (!name) return res.status(400).json({ error: 'Nome não pode ser vazio' });
  db.prepare('UPDATE habits SET name = ?, color = ? WHERE id = ?').run(name, color, h.id);
  res.json({ ok: true });
});

// Excluir hábito
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Marcar ou desmarcar um dia: body { marked: true | false }
router.put('/:id/marks/:date', (req, res) => {
  const { id, date } = req.params;
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Data inválida (use AAAA-MM-DD)' });
  if (!findHabit(id, req.user.id)) return res.status(404).json({ error: 'Hábito não encontrado' });
  if (req.body?.marked) db.prepare('INSERT OR IGNORE INTO habit_marks (habit_id, marked_date) VALUES (?, ?)').run(id, date);
  else db.prepare('DELETE FROM habit_marks WHERE habit_id = ? AND marked_date = ?').run(id, date);
  res.json({ marked: !!req.body?.marked });
});

module.exports = router;
