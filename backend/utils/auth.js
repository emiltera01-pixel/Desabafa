const bcrypt = require('bcrypt');
const { loadUsers, saveUsers } = require('./storage');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function getCurrentUser(req) {
  const users = loadUsers();
  return users.find(u => u.id === req.session.user?.id) || null;
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Precisas de estar identificado.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Precisas de estar identificado.' });
  const user = getCurrentUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  next();
}

function requireNickname(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Precisas de estar identificado.' });
  const user = getCurrentUser(req);
  if (!user || !user.nickname) return res.status(400).json({ error: 'Primeiro tens de escolher um nome fictício.' });
  next();
}

async function ensureAdminExists() {
  const users = loadUsers();
  if (users.some(u => u.role === 'admin')) return;

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  users.push({
    id: Date.now(),
    username: ADMIN_USERNAME,
    password: hash,
    nickname: 'Admin',
    role: 'admin'
  });
  saveUsers(users);
}

module.exports = {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  getCurrentUser,
  requireLogin,
  requireAdmin,
  requireNickname,
  ensureAdminExists
};