// Middleware: só deixa passar quem mandou um token de login válido
const jwt = require('jsonwebtoken');
const { db, JWT_SECRET } = require('./db');

module.exports = function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sem autorização' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(req.user.id)) throw new Error();
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada, entre de novo' });
  }
};
