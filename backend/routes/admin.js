const express = require('express');
const { loadMessages, saveMessages, loadAiUsers } = require('../utils/storage');
const { requireLogin, requireAdmin } = require('../utils/auth');

const router = express.Router();

router.get('/stats', requireLogin, requireAdmin, (req, res) => {
  const messages = loadMessages();
  const aiUsers = loadAiUsers();

  const totalComments = messages.reduce((acc, m) => acc + (m.comments ? m.comments.length : 0), 0);
  const reported = messages.filter(m => (m.reports || 0) > 0).length;

  res.json({
    messagesCount: messages.length,
    commentsCount: totalComments,
    reportedCount: reported,
    aiUsersCount: aiUsers.length
  });
});

router.delete('/messages/:id', requireLogin, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const messages = loadMessages();
  const index = messages.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });

  messages.splice(index, 1);
  saveMessages(messages);
  res.json({ success: true });
});

router.delete('/comments/:commentId', requireLogin, requireAdmin, (req, res) => {
  const commentId = Number(req.params.commentId);
  const messages = loadMessages();
  let found = false;

  for (const msg of messages) {
    if (!Array.isArray(msg.comments)) continue;
    const idx = msg.comments.findIndex(c => c.id === commentId);
    if (idx !== -1) {
      msg.comments.splice(idx, 1);
      found = true;
      break;
    }
  }

  if (!found) return res.status(404).json({ error: 'Comentário não encontrado' });

  saveMessages(messages);
  res.json({ success: true });
});

module.exports = router;