/**
 * VeloHub V3 - Sociais Gemini Service
 * VERSION: v1.2.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.2.0:
 * - stripReportPreamble: remove "Com certeza", "Como especialista", etc.
 * - Prompt: instruções para não incluir preâmbulos
 *
 * Serviço de IA para análise de sentimento e geração de relatórios (módulo Sociais)
 * Usa config.GEMINI_API_KEY (chave centralizada do VeloHub) e gemini-2.5-pro (thinking)
 */

const config = require('../config');

let GoogleGenerativeAI = null;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
  console.warn('⚠️ @google/generative-ai não disponível para Sociais');
}

let genAI = null;
const GEMINI_MODEL = 'gemini-2.5-pro';

const configureGemini = () => {
  if (!GoogleGenerativeAI || !config.GEMINI_API_KEY) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  return genAI;
};

const analyzeSentimentAndReason = async (text) => {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { success: false, error: 'Texto inválido', fallback: { sentiment: 'Neutro', reason: 'Suporte' } };
    }
    const ai = configureGemini();
    if (!ai) {
      return { success: false, error: 'Gemini não configurado', fallback: { sentiment: 'Neutro', reason: 'Suporte' } };
    }
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `Analise o texto e retorne APENAS JSON: {"sentiment": "Positivo"|"Neutro"|"Negativo", "reason": "Produto"|"Suporte"|"Bug"|"Elogio"|"Reclamação"|"Oculto"|"Outro"}\nTexto: "${text}"`;
    const result = await model.generateContent(prompt);
    let content = result.response.text().trim();
    if (content.includes('```')) content = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(content);
    const validS = ['Positivo', 'Neutro', 'Negativo'];
    const validR = ['Produto', 'Suporte', 'Bug', 'Elogio', 'Reclamação', 'Oculto', 'Outro'];
    return {
      success: true,
      data: {
        sentiment: validS.includes(analysis.sentiment) ? analysis.sentiment : 'Neutro',
        reason: validR.includes(analysis.reason) ? analysis.reason : 'Suporte'
      }
    };
  } catch (error) {
    return { success: false, error: error.message, fallback: { sentiment: 'Neutro', reason: 'Suporte' } };
  }
};

const stripReportPreamble = (text) => {
  if (!text || typeof text !== 'string') return text;
  const stripped = text
    .replace(/^Com certeza\.?\s*/i, '')
    .replace(/^Como [Ee]specialista em CX[^.]*\.?\s*/i, '')
    .replace(/^[^#]*?transformei os dados brutos em um relatório acionável[^.]*\.?\s*/i, '')
    .replace(/^(?:\s*---\s*){1,3}\s*/m, '')
    .trim();
  const firstHeading = stripped.match(/^#\s+.+$/m);
  if (firstHeading) {
    const idx = stripped.indexOf(firstHeading[0]);
    return stripped.substring(idx).trim();
  }
  return stripped;
};

const generateExecutiveReport = async (data) => {
  try {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { success: false, error: 'Dados inválidos' };
    }
    const ai = configureGemini();
    if (!ai) return { success: false, error: 'Gemini não configurado' };
    const dataSummary = Array.isArray(data)
      ? data.map((i, idx) => `${idx + 1}. ${JSON.stringify(i)}`).join('\n')
      : JSON.stringify(data);
    const prompt = `Transforme os dados em Relatório Executivo em Markdown. IMPORTANTE: Retorne APENAS o conteúdo do relatório, sem preâmbulos, introduções ou frases como "Com certeza", "Como especialista", "transformei os dados" etc. Comece direto com "# Relatório Executivo de CX".

DADOS:\n${dataSummary}\n\nESTRUTURA OBRIGATÓRIA: # Relatório Executivo de CX | ## 1. Visão Geral | ## 2. Insights | ## 3. Análise | ## 4. Pontos de Atrito | ## 5. Action Plan | ## 6. Conclusão`;
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    let report = result.response.text().trim();
    report = stripReportPreamble(report);
    return { success: true, data: report };
  } catch (error) {
    return { success: false, error: error.message || 'Erro ao gerar relatório' };
  }
};

module.exports = { analyzeSentimentAndReason, generateExecutiveReport, stripReportPreamble };
