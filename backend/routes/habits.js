const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// Middleware: verifica se o token é válido
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sem autorização' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Buscar todos os hábitos do usuário
router.get('/', auth, async (req, res) => {
  const habits = await db.query(
    `SELECT h.*, 
      json_agg(hm.marked_date) FILTER (WHERE hm.marked_date IS NOT NULL) as marks
     FROM habits h
     LEFT JOIN habit_marks hm ON hm.habit_id = h.id
     WHERE h.user_id = $1
     GROUP BY h.id ORDER BY h.created_at`,
    [req.user.id]
  );
  res.json(habits.rows);
});

// Criar hábito
router.post('/', auth, async (req, res) => {
  const { name, color } = req.body;
  const result = await db.query(
    'INSERT INTO habits (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, name, color || '#10b981']
  );
  res.json(result.rows[0]);
});

// Deletar hábito
router.delete('/:id', auth, async (req, res) => {
  await db.query(
    'DELETE FROM habits WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// Marcar/desmarcar dia
router.post('/:id/mark', auth, async (req, res) => {
  const { date } = req.body; // formato: "2026-04-19"
  const exists = await db.query(
    'SELECT id FROM habit_marks WHERE habit_id = $1 AND marked_date = $2',
    [req.params.id, date]
  );
  if (exists.rows.length > 0) {
    await db.query('DELETE FROM habit_marks WHERE habit_id = $1 AND marked_date = $2',
      [req.params.id, date]);
    res.json({ marked: false });
  } else {
    await db.query('INSERT INTO habit_marks (habit_id, marked_date) VALUES ($1, $2)',
      [req.params.id, date]);
    res.json({ marked: true });
  }
});

module.exports = router;