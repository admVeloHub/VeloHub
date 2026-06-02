/**
 * VeloHub V3 — API Home Google Calendar (agenda corporativa Velotax)
 * VERSION: v1.2.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Persistência: console_config.email_config / _id email_calendar_api
 *
 * GET  /api/google-calendar/config
 * PUT  /api/google-calendar/config
 * GET  /api/google-calendar/status
 * POST /api/google-calendar/connect
 * POST /api/google-calendar/disconnect
 * GET  /api/google-calendar/eventos
 */

const express = require('express');
const { getCadastroCollection } = require('../../../config/funcionariosDb');
const { COLLECTION_NAME, FEED_DOCUMENT_ID } = require('../../../config/googleCalendarFeedConfig');
const {
  getFeedConfig,
  saveFeedEmail,
  exchangeAuthorizationCode,
  saveFeedTokens,
  disconnectFeed,
  listUpcomingFeedEvents,
} = require('../../../services/googleCalendar/googleCalendarService');

/**
 * @param {import('express').Request} req
 */
function getHeaderEmail(req) {
  const h = req.headers['x-user-email'];
  return h != null ? String(h).trim().toLowerCase() : '';
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
const initGoogleCalendarRoutes = (mongoClient, connectToMongo) => {
  const router = express.Router();

  /**
   * @param {string} email
   */
  async function assertFuncionario(email) {
    if (!mongoClient || !email) return null;
    await connectToMongo();
    const col = getCadastroCollection(mongoClient);
    const normalized = email.toLowerCase();
    let funcionario = await col.findOne({ userMail: normalized });
    if (!funcionario) {
      funcionario = await col.findOne({
        userMail: {
          $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        },
      });
    }
    if (!funcionario) {
      funcionario = await col.findOne({ email: normalized });
    }
    return funcionario;
  }

  async function assertAdmin(req, res) {
    const email = getHeaderEmail(req);
    if (!email) {
      res.status(401).json({ success: false, message: 'Sessão não identificada' });
      return null;
    }
    const funcionario = await assertFuncionario(email);
    if (!funcionario) {
      res.status(403).json({ success: false, message: 'Usuário não autorizado' });
      return null;
    }
    return email;
  }

  router.get('/config', async (req, res) => {
    try {
      if (!(await assertAdmin(req, res))) return;
      const config = await getFeedConfig(mongoClient, connectToMongo);
      return res.json({
        success: true,
        ...config,
        collectionName: COLLECTION_NAME,
        documentId: FEED_DOCUMENT_ID,
      });
    } catch (error) {
      console.error('[google-calendar/config GET]', error.message);
      return res.status(500).json({ success: false, message: 'Erro ao obter configuração da agenda' });
    }
  });

  router.put('/config', async (req, res) => {
    try {
      if (!(await assertAdmin(req, res))) return;
      const feedEmail = req.body?.feedEmail;
      if (feedEmail == null || !String(feedEmail).trim()) {
        return res.status(400).json({ success: false, message: 'feedEmail é obrigatório' });
      }
      const config = await saveFeedEmail(String(feedEmail), mongoClient, connectToMongo);
      return res.json({
        success: true,
        message: 'E-mail da agenda salvo. Conecte o OAuth usando a conta informada.',
        ...config,
      });
    } catch (error) {
      console.error('[google-calendar/config PUT]', error.message);
      return res.status(400).json({ success: false, message: error.message });
    }
  });

  router.get('/status', async (req, res) => {
    try {
      if (!(await assertAdmin(req, res))) return;
      const config = await getFeedConfig(mongoClient, connectToMongo);
      return res.json({ success: true, ...config });
    } catch (error) {
      console.error('[google-calendar/status]', error.message);
      return res.status(500).json({ success: false, message: 'Erro ao verificar conexão' });
    }
  });

  router.post('/connect', async (req, res) => {
    try {
      if (!(await assertAdmin(req, res))) return;
      const code = req.body?.code != null ? String(req.body.code).trim() : '';
      if (!code) {
        return res.status(400).json({ success: false, message: 'code é obrigatório' });
      }

      const tokens = await exchangeAuthorizationCode(code);
      await saveFeedTokens(tokens, mongoClient, connectToMongo);
      const config = await getFeedConfig(mongoClient, connectToMongo);

      return res.json({
        success: true,
        connected: true,
        feedEmail: config.feedEmail,
        message: 'Google Agenda conectada para a conta configurada',
      });
    } catch (error) {
      if (error.code === 'FEED_EMAIL_REQUIRED') {
        return res.status(400).json({ success: false, message: error.message });
      }
      console.error('[google-calendar/connect]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Não foi possível conectar ao Google Agenda',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  router.post('/disconnect', async (req, res) => {
    try {
      if (!(await assertAdmin(req, res))) return;
      await disconnectFeed(mongoClient, connectToMongo);
      const config = await getFeedConfig(mongoClient, connectToMongo);
      return res.json({
        success: true,
        connected: false,
        feedEmail: config.feedEmail,
        message: 'Google Agenda desconectada',
      });
    } catch (error) {
      console.error('[google-calendar/disconnect]', error.message);
      return res.status(500).json({ success: false, message: 'Erro ao desconectar' });
    }
  });

  router.get('/eventos', async (req, res) => {
    try {
      const email = getHeaderEmail(req);
      if (email) {
        const funcionario = await assertFuncionario(email);
        if (!funcionario) {
          return res.status(403).json({ success: false, message: 'Usuário não autorizado' });
        }
      }

      const limitRaw = req.query?.limit;
      const limit = limitRaw != null ? Number(limitRaw) : 4;

      const eventos = await listUpcomingFeedEvents(limit, mongoClient, connectToMongo);
      const config = await getFeedConfig(mongoClient, connectToMongo);
      return res.json({ success: true, feedEmail: config.feedEmail, data: eventos });
    } catch (error) {
      if (error.code === 'NOT_CONNECTED' || error.code === 'FEED_NOT_CONFIGURED') {
        return res.status(409).json({
          success: false,
          connected: false,
          message: 'Agenda Velotax não configurada ou não conectada no Console',
        });
      }
      console.error('[google-calendar/eventos]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar eventos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  return router;
};

module.exports = { initGoogleCalendarRoutes };
