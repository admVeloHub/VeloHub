/**
 * VeloHub V3 - Rotas do Módulo Sociais
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Rotas para tabulação, dashboard, feed, análise IA e relatórios.
 * Adaptado do natralha para usar client e connectToMongo do VeloHub.
 */

const express = require('express');
const createSociaisMetricas = require('../models/SociaisMetricas');
const sociaisGeminiService = require('../services/sociaisGeminiService');

function initSociaisRoutes(client, connectToMongo) {
  const router = express.Router();
  const SociaisMetricas = createSociaisMetricas(client, connectToMongo);

  // POST /api/sociais/tabulation - Criar nova tabulação
  router.post('/tabulation', async (req, res) => {
    try {
      await connectToMongo();
      const { clientName, socialNetwork, messageText, rating, contactReason, sentiment, directedCenter, link, createdAt } = req.body;
      if (!clientName || !socialNetwork || !messageText) {
        return res.status(400).json({ success: false, error: 'clientName, socialNetwork e messageText são obrigatórios' });
      }
      const tabulationData = {
        clientName, socialNetwork, messageText,
        rating: rating || null,
        contactReason: contactReason || null,
        sentiment: sentiment || null,
        directedCenter: directedCenter !== undefined ? Boolean(directedCenter) : false,
        link: link || null,
        createdAt: createdAt || null
      };
      const result = await SociaisMetricas.create(tabulationData);
      if (result.success) return res.status(201).json(result);
      return res.status(400).json(result);
    } catch (error) {
      console.error('❌ [sociais] POST /tabulation:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // GET /api/sociais/tabulations - Listar tabulações com filtros
  router.get('/tabulations', async (req, res) => {
    try {
      const filters = {};
      if (req.query.socialNetwork) filters.socialNetwork = Array.isArray(req.query.socialNetwork) ? req.query.socialNetwork : [req.query.socialNetwork];
      if (req.query.contactReason) filters.contactReason = Array.isArray(req.query.contactReason) ? req.query.contactReason : [req.query.contactReason];
      if (req.query.sentiment) filters.sentiment = Array.isArray(req.query.sentiment) ? req.query.sentiment : [req.query.sentiment];
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.dateTo) filters.dateTo = req.query.dateTo;
      const result = await SociaisMetricas.getAll(filters);
      res.json(result);
    } catch (error) {
      console.error('❌ [sociais] GET /tabulations:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // GET /api/sociais/dashboard/metrics - Métricas do dashboard
  router.get('/dashboard/metrics', async (req, res) => {
    try {
      const filters = {};
      if (req.query.socialNetwork) filters.socialNetwork = Array.isArray(req.query.socialNetwork) ? req.query.socialNetwork : [req.query.socialNetwork];
      if (req.query.contactReason) filters.contactReason = Array.isArray(req.query.contactReason) ? req.query.contactReason : [req.query.contactReason];
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.dateTo) filters.dateTo = req.query.dateTo;
      const result = await SociaisMetricas.getMetrics(filters);
      if (result.success) res.json(result);
      else res.status(500).json(result);
    } catch (error) {
      console.error('❌ [sociais] GET /dashboard/metrics:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // GET /api/sociais/dashboard/charts - Dados para gráficos
  router.get('/dashboard/charts', async (req, res) => {
    try {
      const filters = {};
      if (req.query.socialNetwork) filters.socialNetwork = Array.isArray(req.query.socialNetwork) ? req.query.socialNetwork : [req.query.socialNetwork];
      if (req.query.contactReason) filters.contactReason = Array.isArray(req.query.contactReason) ? req.query.contactReason : [req.query.contactReason];
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.dateTo) filters.dateTo = req.query.dateTo;
      const result = await SociaisMetricas.getChartData(filters);
      if (result.success) res.json(result);
      else res.status(500).json(result);
    } catch (error) {
      console.error('❌ [sociais] GET /dashboard/charts:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // GET /api/sociais/rating/average - Média de ratings
  router.get('/rating/average', async (req, res) => {
    try {
      const filters = {};
      if (req.query.socialNetwork && req.query.socialNetwork !== '') filters.socialNetwork = req.query.socialNetwork;
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.dateTo) filters.dateTo = req.query.dateTo;
      const result = await SociaisMetricas.getRatingAverage(filters);
      if (result.success) res.json(result);
      else res.status(500).json(result);
    } catch (error) {
      console.error('❌ [sociais] GET /rating/average:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // GET /api/sociais/feed - Feed de atendimentos
  router.get('/feed', async (req, res) => {
    try {
      const filters = {};
      if (req.query.socialNetwork) filters.socialNetwork = Array.isArray(req.query.socialNetwork) ? req.query.socialNetwork : [req.query.socialNetwork];
      if (req.query.contactReason) filters.contactReason = Array.isArray(req.query.contactReason) ? req.query.contactReason : [req.query.contactReason];
      if (req.query.sentiment) filters.sentiment = Array.isArray(req.query.sentiment) ? req.query.sentiment : [req.query.sentiment];
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.dateTo) filters.dateTo = req.query.dateTo;
      const result = await SociaisMetricas.getAll(filters);
      res.json(result);
    } catch (error) {
      console.error('❌ [sociais] GET /feed:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // POST /api/sociais/analyze - Análise de sentimento/motivo via IA
  router.post('/analyze', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Texto é obrigatório' });
      }
      const result = await sociaisGeminiService.analyzeSentimentAndReason(text);
      if (result.success) return res.json(result);
      if (result.fallback) {
        return res.json({ success: true, data: result.fallback, warning: result.error });
      }
      res.status(500).json(result);
    } catch (error) {
      console.error('❌ [sociais] POST /analyze:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // POST /api/sociais/report - Gerar relatório executivo via IA
  router.post('/report', async (req, res) => {
    try {
      let data = req.body.data;
      const filters = req.body.filters;
      if (filters && !data) {
        const tabulationsResult = await SociaisMetricas.getAll(filters);
        if (!tabulationsResult.success || tabulationsResult.count === 0) {
          return res.status(404).json({ success: false, error: 'Nenhum dado encontrado para os filtros fornecidos' });
        }
        data = tabulationsResult.data.map(item => ({
          socialNetwork: item.socialNetwork,
          contactReason: item.contactReason,
          sentiment: item.sentiment,
          messageText: item.messageText
        }));
      }
      if (!data) {
        return res.status(400).json({ success: false, error: 'Dados ou filtros são obrigatórios' });
      }
      let result = await sociaisGeminiService.generateExecutiveReport(data);
      if (!result.success) {
        const errorMessage = result.error || '';
        const shouldTryGroq = errorMessage.includes('não disponível') || errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('não configurado') || errorMessage.includes('Gemini') || errorMessage.includes('API key') || errorMessage.includes('API_KEY_INVALID');
        if (shouldTryGroq) {
          try {
            const Groq = require('groq-sdk');
            const GROQ_API_KEY = process.env.GROQ_API_KEY;
            if (GROQ_API_KEY) {
              const groq = new Groq({ apiKey: GROQ_API_KEY });
              const dataSummary = Array.isArray(data)
                ? data.slice(0, 50).map((item, idx) => {
                    if (typeof item === 'object') {
                      const n = item.socialNetwork || 'N/A';
                      const s = item.sentiment || 'N/A';
                      const r = item.contactReason || 'N/A';
                      const m = (item.messageText || '').substring(0, 100);
                      return `${idx + 1}. Rede: ${n} | Sentimento: ${s} | Motivo: ${r} | Mensagem: ${m}`;
                    }
                    return `${idx + 1}. ${JSON.stringify(item)}`;
                  }).join('\n')
                : String(data).substring(0, 4000);
              const prompt = `Contexto: Você é um Especialista em Customer Experience e Data Analytics. Transforme os dados em Relatório Executivo em Markdown.

DADOS COLETADOS:\nTotal: ${Array.isArray(data) ? data.length : 0}\n${dataSummary}

ESTRUTURA: # Relatório Executivo de CX | ## 1. Visão Geral | ## 2. Insights | ## 3. Análise | ## 4. Pontos de Atrito | ## 5. Action Plan | ## 6. Conclusão`;
              const completion = await groq.chat.completions.create({
                messages: [
                  { role: 'system', content: 'Você é consultor sênior de CX. Escreva relatórios executivos em Markdown.' },
                  { role: 'user', content: prompt }
                ],
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
                max_tokens: 4000
              });
              const groqReport = completion.choices[0]?.message?.content || '';
              if (groqReport) result = { success: true, data: groqReport, source: 'groq' };
            }
          } catch (groqError) {
            console.warn('⚠️ [sociais] Groq fallback falhou:', groqError.message);
          }
        }
      }
      if (result.success) return res.json(result);
      res.status(500).json({ success: false, error: result.error || 'Falha ao gerar relatório. Verifique GEMINI_API_KEY ou GROQ_API_KEY no .env do backend.' });
    } catch (error) {
      console.error('❌ [sociais] POST /report:', error);
      res.status(500).json({ success: false, error: error.message || 'Erro interno do servidor' });
    }
  });

  // GET /api/sociais/:id - Obter tabulação por ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await SociaisMetricas.getById(id);
      if (result.success) return res.json(result);
      res.status(result.error === 'Tabulação não encontrada' ? 404 : 500).json(result);
    } catch (error) {
      console.error('❌ [sociais] GET /:id:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // PUT /api/sociais/:id - Atualizar tabulação
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await SociaisMetricas.update(id, req.body);
      if (result.success) return res.json(result);
      res.status(result.error === 'Tabulação não encontrada' ? 404 : 500).json(result);
    } catch (error) {
      console.error('❌ [sociais] PUT /:id:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  // DELETE /api/sociais/:id - Deletar tabulação
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await SociaisMetricas.delete(id);
      if (result.success) return res.json(result);
      res.status(result.error === 'Tabulação não encontrada' ? 404 : 500).json(result);
    } catch (error) {
      console.error('❌ [sociais] DELETE /:id:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  });

  return router;
}

module.exports = initSociaisRoutes;
