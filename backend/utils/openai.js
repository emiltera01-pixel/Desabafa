async function getAiSupportReply(messages) {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();

  if (!apiKey || apiKey.startsWith('coloca-') || apiKey.includes('tua-chave-aqui')) {
    return 'A IA ainda não foi configurada corretamente. Coloca uma chave real no OPENAI_API_KEY.';
  }

  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    messages,
    temperature: 1,
    top_p: 0.95,
    presence_penalty: 0.7,
    frequency_penalty: 0.6
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Erro ao gerar resposta da IA.');
  }

  return data.choices?.[0]?.message?.content?.trim() || 'Não consegui gerar uma resposta agora.';
}

module.exports = { getAiSupportReply };