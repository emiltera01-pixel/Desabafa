require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const { ensureAdminExists } = require('./utils/auth');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-super-escondido',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

ensureAdminExists().then(() => {
  app.listen(PORT, () => console.log(`Servidor a correr em http://localhost:${PORT}`));
});