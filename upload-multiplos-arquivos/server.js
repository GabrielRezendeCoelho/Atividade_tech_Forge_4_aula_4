const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/file');

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: /localhost|127\.0\.0\.1/,
    methods: ['POST', 'GET', 'OPTIONS', 'DELETE'],
  })
);

app.use(express.json());

try {
  if (!userModel.findByUsername('admin')) {
    const hash = bcrypt.hashSync('Admin123!', 10);
    userModel.addUser({ username: 'admin', email: 'admin@example.com', passwordHash: hash, role: 'admin' });
    console.log('Usuário admin criado: username=admin password=Admin123!');
  }
} catch (e) {
  console.error('Erro ao criar admin de teste', e && e.message);
}

app.use('/auth', authRoutes);
app.use('/file', fileRoutes);

app.get('/', (_req, res) => res.send('Servidor modular online'));

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
