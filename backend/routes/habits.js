const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// Envolve rotas async para que erros caiam no tratador de erros (Express 4 e 5)
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

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

router.use(auth);

// Garante que o hábito pertence ao usuário logado
async function ownsHabit(habitId, userId) {
  const r = await db.query('SELECT 1 FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
  return r.rows.length > 0;
}

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Buscar todos os hábitos do usuário (marks no formato "AAAA-MM-DD")
router.get('/', wrap(async (req, res) => {
  const habits = await db.query(
    `SELECT h.*,
       COALESCE(json_agg(to_char(hm.marked_date, 'YYYY-MM-DD'))
         FILTER (WHERE hm.marked_date IS NOT NULL), '[]') AS marks
     FROM habits h
     LEFT JOIN habit_marks hm ON hm.habit_id = h.id
     WHERE h.user_id = $1
     GROUP BY h.id ORDER BY h.created_at`,
    [req.user.id]
  );
  res.json(habits.rows);
}));

// Criar hábito
router.post('/', wrap(async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const color = COLOR_RE.test(req.body?.color) ? req.body.color : '#10b981';
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const result = await db.query(
    'INSERT INTO habits (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, name.slice(0, 60), color]
  );
  res.json(result.rows[0]);
}));

// Editar hábito (nome e/ou cor)
router.patch('/:id', wrap(async (req, res) => {
  const name = req.body?.name !== undefined ? String(req.body.name).trim().slice(0, 60) : null;
  const color = COLOR_RE.test(req.body?.color) ? req.body.color : null;
  if (name === '') return res.status(400).json({ error: 'Nome não pode ser vazio' });
  const result = await db.query(
    `UPDATE habits SET name = COALESCE($1, name), color = COALESCE($2, color)
     WHERE id = $3 AND user_id = $4 RETURNING *`,
    [name, color, req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Hábito não encontrado' });
  res.json(result.rows[0]);
}));

// Deletar hábito
router.delete('/:id', wrap(async (req, res) => {
  await db.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

// Marcar/desmarcar dia
router.post('/:id/mark', wrap(async (req, res) => {
  const { date } = req.body || {}; // formato: "2026-04-19"
  if (!DATE_RE.test(date || '')) return res.status(400).json({ error: 'Data inválida (use AAAA-MM-DD)' });
  if (!(await ownsHabit(req.params.id, req.user.id))) {
    return res.status(404).json({ error: 'Hábito não encontrado' });
  }
  const del = await db.query(
    'DELETE FROM habit_marks WHERE habit_id = $1 AND marked_date = $2 RETURNING id',
    [req.params.id, date]
  );
  if (del.rows.length) return res.json({ marked: false });
  await db.query(
    'INSERT INTO habit_marks (habit_id, marked_date) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.params.id, date]
  );
  res.json({ marked: true });
}));

module.exports = router;
