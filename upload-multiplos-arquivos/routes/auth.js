const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/userModel');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'uma_chave_secreta_local';

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username e password são obrigatórios' });
    }
    if (userModel.findByUsername(username)) {
      return res.status(400).json({ error: 'username já existe' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const created = userModel.addUser({ username, email, passwordHash });
    return res.status(201).json({ message: 'Usuário criado com sucesso', id: created.id });
  } catch (err) {
    console.error('Erro em /auth/register:', err && err.message);
    return res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username e password são obrigatórios' });
    }
    const user = userModel.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

    const payload = { userId: user.id, userRole: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });
    return res.json({ token });
  } catch (err) {
    console.error('Erro em /auth/login:', err && err.message);
    return res.status(500).json({ error: 'Erro ao efetuar login' });
  }
});

module.exports = router;
