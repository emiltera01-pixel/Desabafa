const express = require('express');
const bcrypt = require('bcrypt');
const { loadUsers, saveUsers } = require('../utils/storage');
const { getCurrentUser, requireLogin } = require('../utils/auth');
const { generateSuggestions } = require('../utils/suggestions');

const router = express.Router();

function buildSessionUser(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname || null,
    role: user.role || 'user'
  };
}

router.get('/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  const user = getCurrentUser(req);
  if (!user) return res.json({ user: null });
  res.json({ user: buildSessionUser(user) });
});

router.get('/suggestions', (req, res) => {
  res.json({ suggestions: generateSuggestions(30) });
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Nome e senha são obrigatórios.' });
  }

  const users = loadUsers();
  if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Este nome já existe.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now(),
    username: username.trim(),
    password: hash,
    nickname: null,
    role: 'user'
  };

  users.push(user);
  saveUsers(users);

  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Erro ao criar sessão.' });
    req.session.user = buildSessionUser(user);
    req.session.save(() => res.status(201).json({ user: req.session.user }));
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'Preenche nome e senha.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && (u.role || 'user') !== 'admin');
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });

  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Erro ao criar sessão.' });
    req.session.user = buildSessionUser(user);
    req.session.save(() => res.json({ user: req.session.user }));
  });
});

router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'Preenche nome e senha.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && (u.role || 'user') === 'admin');
  if (!user) return res.status(401).json({ error: 'Acesso restrito ao usuário principal.' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });

  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Erro ao criar sessão.' });
    req.session.user = buildSessionUser(user);
    req.session.save(() => res.json({ user: req.session.user }));
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sessionId', { path: '/' });
    res.json({ success: true });
  });
});

router.post('/nickname', requireLogin, (req, res) => {
  const { nickname } = req.body;
  if (!nickname?.trim()) return res.status(400).json({ error: 'Nome fictício inválido.' });

  const users = loadUsers();
  const idx = users.findIndex(u => u.id === req.session.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilizador não encontrado.' });

  users[idx].nickname = nickname.trim();
  saveUsers(users);

  req.session.user.nickname = nickname.trim();
  req.session.save(() => res.json({ user: req.session.user }));
});

module.exports = router;