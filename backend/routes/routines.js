const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.use(require('../requireAuth'));

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const today = () => new Date().toISOString().slice(0, 10);

const cleanDays = (v) => [...new Set((Array.isArray(v) ? v : []).map(Number).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
const cleanDates = (v) => [...new Set((Array.isArray(v) ? v : []).filter(d => DATE_RE.test(d)))].sort();

/** Valida o corpo da requisição; "base" = valores atuais (para PATCH) */
function clean(body = {}, base = {}) {
  const has = (k) => body[k] !== undefined;
  return {
    name: has('name') ? String(body.name).trim().slice(0, 60) : base.name,
    color: COLOR_RE.test(body.color) ? body.color : (base.color || '#6366f1'),
    time: has('time') ? (TIME_RE.test(body.time) ? body.time : '') : (base.time || ''),
    days: has('days') ? cleanDays(body.days) : (base.days || []),
    extraDates: has('extraDates') ? cleanDates(body.extraDates) : (base.extraDates || []),
    skipDates: has('skipDates') ? cleanDates(body.skipDates) : (base.skipDates || []),
    startDate: DATE_RE.test(body.startDate) ? body.startDate : (base.startDate || today())
  };
}

function rowToRoutine(r, done) {
  return {
    id: r.id, name: r.name, color: r.color, time: r.time,
    days: JSON.parse(r.days), extraDates: JSON.parse(r.extra_dates), skipDates: JSON.parse(r.skip_dates),
    startDate: r.start_date, done: done || []
  };
}

function listRoutines(userId) {
  const rows = db.prepare('SELECT * FROM routines WHERE user_id = ? ORDER BY id').all(userId);
  const done = db.prepare(`
    SELECT d.routine_id, d.done_date FROM routine_done d
    JOIN routines r ON r.id = d.routine_id WHERE r.user_id = ?`).all(userId);
  const by = {};
  done.forEach(d => (by[d.routine_id] ||= []).push(d.done_date));
  return rows.map(r => rowToRoutine(r, by[r.id]));
}

const findRoutine = (id, userId) => db.prepare('SELECT * FROM routines WHERE id = ? AND user_id = ?').get(id, userId);

// Listar
router.get('/', (req, res) => res.json(listRoutines(req.user.id)));

// Criar (aceita "done" para subir rotinas que estavam só no aparelho)
router.post('/', (req, res) => {
  const r = clean(req.body);
  if (!r.name) return res.status(400).json({ error: 'Nome obrigatório' });
  const id = db.transaction(() => {
    const info = db.prepare(`INSERT INTO routines (user_id, name, color, time, days, extra_dates, skip_dates, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(req.user.id, r.name, r.color, r.time,
      JSON.stringify(r.days), JSON.stringify(r.extraDates), JSON.stringify(r.skipDates), r.startDate);
    const newId = Number(info.lastInsertRowid);
    const ins = db.prepare('INSERT OR IGNORE INTO routine_done (routine_id, done_date) VALUES (?, ?)');
    cleanDates(req.body?.done).forEach(d => ins.run(newId, d));
    return newId;
  })();
  res.json({ id, ...r });
});

// Editar (nome, cor, horário, dias, dias avulsos/pulados)
router.patch('/:id', (req, res) => {
  const row = findRoutine(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Rotina não encontrada' });
  const r = clean(req.body, rowToRoutine(row));
  if (!r.name) return res.status(400).json({ error: 'Nome não pode ser vazio' });
  db.prepare(`UPDATE routines SET name = ?, color = ?, time = ?, days = ?, extra_dates = ?, skip_dates = ?, start_date = ?
    WHERE id = ?`).run(r.name, r.color, r.time, JSON.stringify(r.days), JSON.stringify(r.extraDates),
    JSON.stringify(r.skipDates), r.startDate, row.id);
  // dia tirado da rotina não fica como "feito"
  if (r.skipDates.length) {
    const del = db.prepare('DELETE FROM routine_done WHERE routine_id = ? AND done_date = ?');
    r.skipDates.forEach(d => del.run(row.id, d));
  }
  res.json({ ok: true });
});

// Excluir
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM routines WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Marcar feita / não feita num dia: body { done: true | false }
router.put('/:id/done/:date', (req, res) => {
  const { id, date } = req.params;
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Data inválida (use AAAA-MM-DD)' });
  if (!findRoutine(id, req.user.id)) return res.status(404).json({ error: 'Rotina não encontrada' });
  if (req.body?.done) db.prepare('INSERT OR IGNORE INTO routine_done (routine_id, done_date) VALUES (?, ?)').run(id, date);
  else db.prepare('DELETE FROM routine_done WHERE routine_id = ? AND done_date = ?').run(id, date);
  res.json({ done: !!req.body?.done });
});

module.exports = router;
