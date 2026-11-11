const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Cadastro
router.post('/register', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email inválido' });
  if (password.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );
    const user = result.rows[0];
    res.json({ token: signToken(user.id), user });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Email já cadastrado' });
    console.error(e);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Informe email e senha' });
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    res.json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
