// Compromissos: acontecem uma vez só, numa data (ex.: casamento, consulta)
const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.use(require('../requireAuth'));

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Valida o corpo; "base" = valores atuais (para PATCH) */
function clean(body = {}, base = {}) {
  const has = (k) => body[k] !== undefined;
  return {
    name: has('name') ? String(body.name).trim().slice(0, 60) : base.name,
    color: COLOR_RE.test(body.color) ? body.color : (base.color || '#f59e0b'),
    date: DATE_RE.test(body.date) ? body.date : base.date,
    time: has('time') ? (TIME_RE.test(body.time) ? body.time : '') : (base.time || ''),
    note: has('note') ? String(body.note || '').trim().slice(0, 200) : (base.note || ''),
    done: has('done') ? !!body.done : !!base.done
  };
}

const toJson = (r) => ({ id: r.id, name: r.name, color: r.color, date: r.date, time: r.time, note: r.note, done: !!r.done });
const findAppt = (id, userId) => db.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?').get(id, userId);

// Listar (todos, do mais antigo ao mais novo)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM appointments WHERE user_id = ? ORDER BY date, time, id').all(req.user.id);
  res.json(rows.map(toJson));
});

// Criar
router.post('/', (req, res) => {
  const a = clean(req.body);
  if (!a.name) return res.status(400).json({ error: 'Nome obrigatório' });
  if (!a.date) return res.status(400).json({ error: 'Data obrigatória (AAAA-MM-DD)' });
  const info = db.prepare(`INSERT INTO appointments (user_id, name, color, date, time, note, done)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(req.user.id, a.name, a.color, a.date, a.time, a.note, a.done ? 1 : 0);
  res.json({ id: Number(info.lastInsertRowid), ...a });
});

// Editar (qualquer campo, inclusive "done")
router.patch('/:id', (req, res) => {
  const row = findAppt(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Compromisso não encontrado' });
  const a = clean(req.body, toJson(row));
  if (!a.name) return res.status(400).json({ error: 'Nome não pode ser vazio' });
  db.prepare('UPDATE appointments SET name = ?, color = ?, date = ?, time = ?, note = ?, done = ? WHERE id = ?')
    .run(a.name, a.color, a.date, a.time, a.note, a.done ? 1 : 0, row.id);
  res.json({ ok: true });
});

// Excluir
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
