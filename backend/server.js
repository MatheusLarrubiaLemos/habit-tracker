const path = require('path');
const os = require('os');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const { DATA_DIR } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// API
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'habit-tracker' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));

// O próprio servidor também entrega o app (abra http://IP-DO-PC:3000 no navegador)
app.use(express.static(path.join(__dirname, '..', 'www')));

// Erros não tratados viram 500 em vez de derrubar o servidor
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro no servidor' });
});

function lanAddresses() {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
}

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n  Habit Tracker — servidor ligado!\n');
  console.log(`  Neste PC:     http://localhost:${PORT}`);
  lanAddresses().forEach(ip => console.log(`  No celular:   http://${ip}:${PORT}   (mesma rede Wi-Fi)`));
  console.log(`\n  Banco de dados: ${path.join(DATA_DIR, 'habits.db')}`);
  console.log('  Deixe esta janela aberta. Para desligar, feche-a ou aperte Ctrl+C.\n');
});
