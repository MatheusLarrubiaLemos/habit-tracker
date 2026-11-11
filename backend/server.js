const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initSchema } = require('./db');

if (!process.env.JWT_SECRET) {
  console.error('[server] JWT_SECRET não definido — configure no .env (veja .env.example)');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/habits', require('./routes/habits'));

app.get('/', (req, res) => res.json({ status: 'API rodando' }));

// Erros não tratados viram 500 em vez de derrubar o servidor
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro no servidor' });
});

const PORT = process.env.PORT || 3000;
initSchema()
  .then(() => console.log('[db] Tabelas verificadas'))
  .catch(e => console.error('[db] Falha ao criar tabelas:', e.message))
  .finally(() => app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`)));
