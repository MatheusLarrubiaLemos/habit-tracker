const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, JWT_SECRET } = require('../db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '365d' });

// Cadastro
router.post('/register', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email inválido' });
  if (password.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres' });
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }
  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);
  const id = Number(info.lastInsertRowid);
  res.json({ token: signToken(id), user: { id, email } });
});

// Login
router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Informe email e senha' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }
  res.json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
});

module.exports = router;
