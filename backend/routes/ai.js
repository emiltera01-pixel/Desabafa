const express = require('express');
const { getCurrentUser, requireLogin } = require('../utils/auth');
const { getAiSupportReply } = require('../utils/openai');
const { loadAiUsers, saveAiUsers } = require('../utils/storage');

const router = express.Router();

function getChatHistory(req) {
  if (!req.session.aiSupportHistory) req.session.aiSupportHistory = [];
  return req.session.aiSupportHistory;
}

function registerAiUser(username) {
  const users = loadAiUsers();
  if (!users.includes(username)) {
    users.push(username);
    saveAiUsers(users);
  }
}

router.get('/history', requireLogin, (req, res) => {
  res.json({ history: getChatHistory(req) });
});

router.post('/support', requireLogin, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Escreve algo para receber apoio.' });

  const user = getCurrentUser(req);
  const history = getChatHistory(req);

  const displayName = user?.username || 'Amigo(a)';
  registerAiUser(displayName);

  history.push({
    role: 'user',
    content: message.trim(),
    timestamp: new Date().toISOString()
  });

  const messagesForOpenAI = [
    {
      role: 'system',
      content: [
        'És a Germana, uma assistente de apoio emocional com voz humana, calorosa, calma e próxima.',
        'Responde como alguém que escuta de verdade, com empatia, respeito e naturalidade.',
        'Não uses frases repetidas nem genéricas. Evita soar automática.',
        'Dá conselhos práticos, palavras de conforto, validação emocional e orientação sensível de acordo com o que a pessoa disser.',
        'Quando a pessoa estiver triste, consola. Quando estiver confusa, organiza os pensamentos. Quando estiver ansiosa, acalma. Quando estiver magoada, valida a dor. Quando estiver sem esperança, oferece encorajamento realista.',
        'Podes falar de Deus, fé, esperança e força espiritual quando isso combinar com o contexto ou com o estilo da pessoa.',
        'Faz perguntas curtas e humanas para continuar a conversa, sem transformar cada resposta em interrogatório.',
        'Mantém o contexto anterior e responde como numa conversa contínua.',
        'Não repitas avisos sobre ajuda profissional em todas as mensagens.',
        'Só se houver risco imediato, responde com firmeza e incentiva ajuda urgente.',
        `Nome da pessoa: ${displayName}`
      ].join(' ')
    },
    ...history
      .filter(item => item.role === 'user' || item.role === 'assistant')
      .map(item => ({ role: item.role, content: item.content }))
  ];

  try {
    const reply = await getAiSupportReply(messagesForOpenAI);

    history.push({
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString()
    });

    req.session.aiSupportHistory = history;
    req.session.save(() => res.json({ reply, history }));
  } catch (err) {
    history.pop();
    req.session.aiSupportHistory = history;
    req.session.save(() => {});
    res.status(500).json({ error: err.message || 'Erro ao obter resposta da IA.' });
  }
});

router.post('/clear', requireLogin, (req, res) => {
  req.session.aiSupportHistory = [];
  req.session.save(() => res.json({ success: true }));
});

module.exports = router;