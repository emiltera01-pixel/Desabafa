const adjectives = ['Calmo', 'Livre', 'Silente', 'Doce', 'Brando', 'Leve', 'Sereno', 'Manso', 'Quieto', 'Nobre', 'Brilhante', 'Forte', 'Lento', 'Claro', 'Vivo', 'Suave', 'Fiel', 'Oculto', 'Raro', 'Terno', 'Lume', 'Frio', 'Quente', 'Novo', 'Velho', 'Gentil', 'Lindo', 'Sutil', 'Azul', 'Dourado'];
const nouns = ['Lua', 'Vento', 'Nuvem', 'Eco', 'Mar', 'Rio', 'Sol', 'Estrela', 'Brisa', 'Noite', 'Aurora', 'Chama', 'Paz', 'Som', 'Pétala', 'Areia', 'Céu', 'Floresta', 'Gota', 'Horizonte', 'Pedra', 'Fogo', 'Poema', 'Vaga', 'Rosa', 'Luz', 'Mundo', 'Vale', 'Trilho', 'Mistério'];

function generateSuggestions(count = 24) {
  const list = [];
  const used = new Set();

  while (list.length < count) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9999);
    const name = `${adj}${noun}${num}`;
    if (!used.has(name)) {
      used.add(name);
      list.push(name);
    }
  }

  return list;
}

module.exports = { generateSuggestions };