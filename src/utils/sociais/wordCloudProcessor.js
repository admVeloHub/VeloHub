/**
 * VeloHub V3 - WordCloud Processor (Sociais)
 * VERSION: v1.1.1 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.1: Ajuste lista stopwords (sem tokens inválidos); EN básico; sem cortar dia/noite; TLDs só por regex
 * - v1.1.0: Stopwords PT expandidas, normalização NFD, filtro URL/número/ruído (abrev., preposições)
 * - v1.0.0: Base tokenize + stopwords
 */

/** Palavras e ruídos de baixo valor semântico (comparadas após normalização sem acento). */
const STOPWORDS_RAW = [
  // Artigos / pronomes / preposições / conjunções (PT)
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos',
  'nas', 'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas', 'por', 'para', 'pra', 'pro', 'com', 'sem',
  'sob', 'sobre', 'entre', 'até', 'ate', 'desde', 'ante', 'após', 'apos', 'perante', 'contra', 'tras', 'detrás',
  'mediante', 'durante', 'e', 'ou', 'nem', 'mas', 'porém', 'porem', 'contudo', 'todavia', 'entretanto', 'logo',
  'que', 'se', 'como', 'quando', 'onde', 'cujo', 'cuja', 'cujos', 'cujas', 'qual', 'quais', 'quem',
  // Pronomes / demonstrativos
  'eu', 'tu', 'ele', 'ela', 'nós', 'nos', 'vos', 'eles', 'elas', 'me', 'te', 'lhe', 'lhes', 'mim', 'ti',
  'si', 'consigo', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'seu', 'sua', 'seus', 'suas',
  'nosso', 'nossa', 'nossos', 'nossas', 'deles', 'delas', 'este', 'esta', 'estes', 'estas', 'esse', 'essa',
  'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo', 'outro', 'outra',
  // Verbos auxiliares / copulativos muito frequentes
  'é', 'e', 'são', 'somos', 'sois', 'era', 'eram', 'foi', 'foram', 'ser', 'sendo', 'sido', 'há', 'ha',
  'havia', 'hei', 'havemos', 'houve', 'estar', 'está', 'esta', 'estão', 'estao', 'estou', 'estamos', 'estive',
  'ter', 'tem', 'têm', 'temos', 'tinha', 'tinham', 'tendo', 'tido', 'fui', 'fomos',
  'ir', 'vou', 'vai', 'vamos', 'indo', 'ido', 'dar', 'dá', 'da', 'dou', 'deem', 'fazer', 'faz', 'faço', 'faco',
  'fiz', 'fizeram', 'fazendo', 'feito', 'diz', 'disse', 'dizer', 'quer', 'querer', 'quero', 'quis', 'podem',
  'pode', 'poder', 'pude', 'deve', 'devo', 'dever', 'parece', 'parecer', 'vem', 'vir', 'vendo', 'vi', 'ver',
  'sei', 'saber', 'sabia', 'acho', 'achar', 'aqui', 'ali', 'aí', 'ai', 'lá', 'la', 'então', 'entao', 'pois',
  // Quantificadores / advérbios vazios
  'mais', 'menos', 'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca', 'poucos', 'poucas', 'bem', 'mal',
  'tão', 'tao', 'tanto', 'tanta', 'cada', 'todo', 'toda', 'todos', 'todas', 'outros', 'outras', 'próprio',
  'coisa', 'coisas', 'vez', 'vezes', 'já', 'ja', 'ainda', 'nunca', 'sempre', 'também', 'tambem', 'só', 'so',
  'apenas', 'nem', 'não', 'nao', 'sim', 'né', 'ne', 'cá', 'ca', 'lá', 'la', 'tipo', 'assim', 'mesmo', 'mesma',
  'vários', 'varias', 'quanto', 'quanta', 'várias',
  // Internet / metadados (TLD e domínios tratados em isStructuralNoise)
  'www', 'http', 'https', 'ftp', 'html', 'href', 'src',
  // Inglês frequente em mensagens mistas
  'the', 'and', 'or', 'for', 'with', 'from', 'this', 'that', 'you', 'your', 'are', 'was', 'were', 'has', 'have',
  'not', 'but', 'can', 'will', 'just', 'get', 'got', 'pls', 'please',
  // Abreviações / preenchimentos
  'etc', 'ex', 'obs', 'observação', 'observacao', 'sr', 'sra', 'dr', 'dra', 'pág', 'pag', 'tel', 'cel',
  'vc', 'vcs', 'tb', 'tbm', 'pq', 'msm', 'blz', 'kd', 'q', 'hrs', 'min', 'seg',
  // Palavras genéricas de mensagem (evita remover dia/noite/tarde isolados — podem ser contexto do problema)
  'favor', 'obrigado', 'obrigada', 'oi', 'olá', 'ola', 'bom', 'boa', 'prezados',
  'prezado', 'prezada', 'att', 'atts', 'abraço', 'abraco',
];

/**
 * Remove acentos para cruzar "até"/"ate", "não"/"nao", etc.
 * @param {string} s
 * @returns {string}
 */
export const normalizeTokenForMatch = (s) => {
  if (!s || typeof s !== 'string') return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
};

const STOPWORDS = new Set(STOPWORDS_RAW.map(normalizeTokenForMatch));

/** Ruído: URLs, domínios soltos, só números, repetição exagerada (kkkk). */
const isStructuralNoise = (raw, normalized) => {
  const t = String(raw).toLowerCase();
  if (!normalized || normalized.length < 3) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (/[._]?@/.test(t)) return true;
  if (/https?:\/\//i.test(t) || t.includes('http') || t.includes('www')) return true;
  if (/^www\.?/.test(t)) return true;
  if (/\.(com|br|org|net|gov|io|me)(\/|$|\?)/i.test(t)) return true;
  // Uma letra repetida 3+ vezes (kkk, uuu, rsrs cortado)
  if (/^(.)\1{2,}$/.test(normalized)) return true;
  return false;
};

export const tokenizeText = (text) => {
  if (!text || typeof text !== 'string') return [];
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/gi, ' ')
    .replace(/www\.[^\s]+/gi, ' ')
    .replace(/[.,!?;:()\[\]{}'"“”«»…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/);
  return words.filter((word) => {
    const n = normalizeTokenForMatch(word);
    return n.length >= 3 && n.length <= 40 && !isStructuralNoise(word, n);
  });
};

export const countWordFrequency = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return {};
  const frequency = {};
  messages.forEach((message) => {
    if (!message || typeof message !== 'string') return;
    const tokens = tokenizeText(message);
    const filteredTokens = tokens.filter((token) => {
      const n = normalizeTokenForMatch(token);
      if (STOPWORDS.has(n)) return false;
      return true;
    });
    filteredTokens.forEach((word) => {
      const key = normalizeTokenForMatch(word);
      if (!key || key.length < 3) return;
      frequency[key] = (frequency[key] || 0) + 1;
    });
  });
  return frequency;
};

export const processMessagesForWordCloud = (messages, maxWords = 50) => {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const messageTexts = messages
    .map((item) => item.messageText || item.message_text || '')
    .filter((text) => text && typeof text === 'string' && text.trim().length > 0);
  if (messageTexts.length === 0) return [];
  const frequency = countWordFrequency(messageTexts);
  return Object.entries(frequency)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxWords);
};
