const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'desabafa-secreto',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }
}));

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

let categories = ['Todos', 'Amor', 'Família', 'Trabalho', 'Saúde', 'Ansiedade', 'Amizade', 'Outro'];
let messages = [];
let messageId = 1;
let commentId = 1;
let totalUniqueUsers = 0;
const visitedSessions = new Set();

function isAdmin(req) {
  return req.session.user && req.session.user.role === 'admin';
}

function getDisplayName(req) {
  return req.session.user?.nickname || req.session.nickname || 'Anónimo';
}

app.use((req, res, next) => {
  if (!visitedSessions.has(req.sessionID)) {
    visitedSessions.add(req.sessionID);
    totalUniqueUsers += 1;
  }
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/support.html', (req, res) => {
  res.sendFile(path.join(publicPath, 'support.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    req.session.user = {
      id: 1,
      role: 'guest',
      nickname: req.session.nickname || ''
    };
  }
  res.json({ user: req.session.user });
});

app.post('/api/nickname', (req, res) => {
  const nickname = String(req.body.nickname || '').trim();
  if (!nickname) return res.status(400).json({ error: 'Nome inválido.' });

  req.session.nickname = nickname;
  if (!req.session.user) {
    req.session.user = { id: 1, role: 'guest', nickname };
  } else {
    req.session.user.nickname = nickname;
  }

  res.json({ ok: true, user: req.session.user });
});

app.get('/api/categories', (req, res) => {
  res.json({ categories });
});

app.get('/api/messages', (req, res) => {
  const category = req.query.category || 'Todos';
  let result = messages;
  if (category !== 'Todos') result = result.filter(m => m.category === category);
  res.json(result);
});

app.post('/api/messages', (req, res) => {
  const text = String(req.body.text || '').trim();
  const category = String(req.body.category || 'Outro').trim();
  if (!text) return res.status(400).json({ error: 'Mensagem vazia.' });

  const msg = {
    id: messageId++,
    text,
    category,
    displayName: getDisplayName(req),
    ownerId: req.session.user?.id || null,
    createdAt: new Date().toISOString(),
    reports: 0,
    comments: []
  };

  messages.unshift(msg);
  res.json(msg);
});

app.post('/api/messages/:id/report', (req, res) => {
  const id = Number(req.params.id);
  const msg = messages.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada.' });

  msg.reports += 1;
  res.json({ ok: true, reports: msg.reports });
});

app.put('/api/messages/:id', (req, res) => {
  const id = Number(req.params.id);
  const msg = messages.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada.' });

  const text = String(req.body.text || '').trim();
  const category = String(req.body.category || msg.category || 'Outro').trim();
  if (!text) return res.status(400).json({ error: 'Texto inválido.' });

  if (!(isAdmin(req) || req.session.user?.id === msg.ownerId)) {
    return res.status(403).json({ error: 'Sem permissão para editar.' });
  }

  msg.text = text;
  msg.category = category;
  res.json({ ok: true, message: msg });
});

app.delete('/api/admin/messages/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Acesso negado.' });

  const id = Number(req.params.id);
  const before = messages.length;
  messages = messages.filter(m => m.id !== id);

  if (messages.length === before) return res.status(404).json({ error: 'Mensagem não encontrada.' });
  res.json({ ok: true });
});

app.post('/api/messages/:id/comments', (req, res) => {
  const id = Number(req.params.id);
  const msg = messages.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada.' });

  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Comentário vazio.' });

  msg.comments.push({
    id: commentId++,
    text,
    user: getDisplayName(req),
    reactions: { like: 0, love: 0, laugh: 0 }
  });

  res.json({ ok: true });
});

app.post('/api/messages/:messageId/comments/:commentId/reaction', (req, res) => {
  const messageIdNum = Number(req.params.messageId);
  const commentIdNum = Number(req.params.commentId);
  const reaction = String(req.body.reaction || '');

  const msg = messages.find(m => m.id === messageIdNum);
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada.' });

  const comment = msg.comments.find(c => c.id === commentIdNum);
  if (!comment) return res.status(404).json({ error: 'Comentário não encontrado.' });

  if (comment.reactions[reaction] == null) comment.reactions[reaction] = 0;
  comment.reactions[reaction] += 1;

  res.json({ ok: true });
});

app.delete('/api/admin/comments/:commentId', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Acesso negado.' });

  const commentIdNum = Number(req.params.commentId);
  for (const msg of messages) {
    const before = msg.comments.length;
    msg.comments = msg.comments.filter(c => c.id !== commentIdNum);
    if (msg.comments.length !== before) return res.json({ ok: true });
  }

  res.status(404).json({ error: 'Comentário não encontrado.' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/admin/stats', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Acesso negado.' });

  res.json({
    totalUniqueUsers,
    totalMessages: messages.length,
    totalComments: messages.reduce((sum, msg) => sum + msg.comments.length, 0),
    totalReports: messages.reduce((sum, msg) => sum + msg.reports, 0)
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});