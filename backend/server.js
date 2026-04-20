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

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-super-escondido',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'public', 'admin.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'public', 'register.html'));
});

app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

ensureAdminExists().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
  });
});