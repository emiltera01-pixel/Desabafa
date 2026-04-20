const express = require('express');
const { loadMessages, saveMessages } = require('../utils/storage');
const { getCurrentUser, requireLogin, requireNickname } = require('../utils/auth');

const router = express.Router();

const categories = ['Todos', 'Amor', 'Tristeza', 'Ansiedade', 'Família', 'Escola', 'Trabalho', 'Amizade'];

router.get('/categories', (req, res) => {
  res.json({ categories });
});

router.get('/messages', (req, res) => {
  const messages = loadMessages();
  const category = req.query.category || 'Todos';
  if (category === 'Todos') return res.json(messages);
  res.json(messages.filter(m => m.category === category));
});

router.post('/messages', requireNickname, (req, res) => {
  const { text, category } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Mensagem vazia' });
  if (!categories.includes(category)) return res.status(400).json({ error: 'Categoria inválida.' });

  const user = getCurrentUser(req);
  const messages = loadMessages();

  const message = {
    id: Date.now(),
    ownerId: req.session.user.id,
    ownerUsername: req.session.user.username,
    displayName: user.nickname,
    text: text.trim(),
    category,
    createdAt: new Date().toISOString(),
    comments: [],
    reports: 0
  };

  messages.unshift(message);
  saveMessages(messages);
  res.status(201).json(message);
});

router.put('/messages/:id', requireLogin, (req, res) => {
  const id = Number(req.params.id);
  const { text, category } = req.body;
  const user = getCurrentUser(req);
  const messages = loadMessages();
  const index = messages.findIndex(m => m.id === id);

  if (index === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });
  if (messages[index].ownerId !== req.session.user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Não podes editar esta mensagem.' });
  }

  if (text?.trim()) messages[index].text = text.trim();
  if (categories.includes(category)) messages[index].category = category;

  saveMessages(messages);
  res.json(messages[index]);
});

router.delete('/messages/:id', requireLogin, (req, res) => {
  const id = Number(req.params.id);
  const user = getCurrentUser(req);
  const messages = loadMessages();
  const index = messages.findIndex(m => m.id === id);

  if (index === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });
  if (messages[index].ownerId !== req.session.user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Não podes apagar esta mensagem.' });
  }

  messages.splice(index, 1);
  saveMessages(messages);
  res.json({ success: true });
});

router.post('/messages/:id/report', requireLogin, (req, res) => {
  const id = Number(req.params.id);
  const messages = loadMessages();
  const index = messages.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });

  messages[index].reports = (messages[index].reports || 0) + 1;
  saveMessages(messages);
  res.json({ success: true, reports: messages[index].reports });
});

router.post('/messages/:id/comments', requireLogin, (req, res) => {
  const id = Number(req.params.id);
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Comentário vazio' });

  const messages = loadMessages();
  const index = messages.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Desabafo não encontrado' });

  const user = getCurrentUser(req);
  const comment = {
    id: Date.now(),
    ownerId: req.session.user.id,
    user: user?.nickname || 'Anónimo',
    text: text.trim(),
    reactions: { like: 0, love: 0, laugh: 0 }
  };

  if (!Array.isArray(messages[index].comments)) messages[index].comments = [];
  messages[index].comments.push(comment);
  saveMessages(messages);
  res.status(201).json(comment);
});

router.post('/messages/:messageId/comments/:commentId/reaction', requireLogin, (req, res) => {
  const messageId = Number(req.params.messageId);
  const commentId = Number(req.params.commentId);
  const { reaction } = req.body;

  const messages = loadMessages();
  const message = messages.find(m => m.id === messageId);
  if (!message) return res.status(404).json({ error: 'Desabafo não encontrado' });

  const comment = Array.isArray(message.comments) ? message.comments.find(c => c.id === commentId) : null;
  if (!comment) return res.status(404).json({ error: 'Comentário não encontrado' });

  if (!comment.reactions) comment.reactions = { like: 0, love: 0, laugh: 0 };
  if (reaction === 'like') comment.reactions.like += 1;
  if (reaction === 'love') comment.reactions.love += 1;
  if (reaction === 'laugh') comment.reactions.laugh += 1;

  saveMessages(messages);
  res.json(comment);
});

module.exports = router;