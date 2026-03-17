/**
 * VeloHub V3 - WordCloud Processor (Sociais)
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 */

const STOPWORDS = [
  'que', 'e', 'de', 'a', 'o', 'para', 'com', 'em', 'um', 'uma', 'é', 'no', 'na',
  'do', 'da', 'dos', 'das', 'por', 'se', 'mais', 'como', 'mas', 'foi', 'ao',
  'ele', 'ela', 'nos', 'nas', 'pelo', 'pela', 'pelos', 'pelas', 'são', 'ser',
  'ter', 'tem', 'está', 'estão', 'foram', 'será', 'serão', 'terá', 'terão',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele',
  'aquela', 'aqueles', 'aquelas', 'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
  'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'seu', 'sua',
  'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas', 'deles', 'delas', 'ao',
  'aos', 'às', 'pelo', 'pela', 'pelos', 'pelas', 'num', 'numa', 'nuns', 'numas',
  'dum', 'duma', 'duns', 'dumas', 'num', 'numa', 'nuns', 'numas', 'à', 'às'
];

export const tokenizeText = (text) => {
  if (!text || typeof text !== 'string') return [];
  const cleaned = text.toLowerCase()
    .replace(/[.,!?;:()\[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/);
  return words.filter(word => word.length >= 3 && word.length <= 20);
};

export const countWordFrequency = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return {};
  const frequency = {};
  messages.forEach(message => {
    if (!message || typeof message !== 'string') return;
    const tokens = tokenizeText(message);
    const filteredTokens = tokens.filter(token => !STOPWORDS.includes(token));
    filteredTokens.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
  });
  return frequency;
};

export const processMessagesForWordCloud = (messages, maxWords = 50) => {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const messageTexts = messages
    .map(item => item.messageText || item.message_text || '')
    .filter(text => text && typeof text === 'string' && text.trim().length > 0);
  if (messageTexts.length === 0) return [];
  const frequency = countWordFrequency(messageTexts);
  return Object.entries(frequency)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxWords);
};
