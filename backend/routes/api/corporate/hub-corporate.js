/**
 * VeloHub V3 — API Corporate (Ética e Conduta, LGPD, Termos + ciência)
 * VERSION: v1.2.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * GET  /api/corporate/etica-conduta/latest
 * GET  /api/corporate/etica-conduta/acknowledgments/:userEmail
 * POST /api/corporate/etica-conduta/:versaoId/acknowledge
 * GET  /api/corporate/politicas-normas/* (alias legado → etica-conduta)
 * GET  /api/corporate/lgpd/latest
 * GET  /api/corporate/termo-usuario/latest
 * GET  /api/corporate/compliance/pending?userEmail=
 */

const express = require('express');
const { ObjectId } = require('mongodb');
const {
  getCorpoEticaCondutaCollection,
  getEticaCondutaAckCollection,
  getCorpoLgpdCollection,
  getLgpdAckCollection,
  getCorpoTermoUsuarioCollection,
  getTermoUsuarioAckCollection,
} = require('../../../config/hubCorporateDb');

const COMPLIANCE_ITEMS = [
  {
    type: 'lgpd',
    label: 'LGPD',
    path: '/portal/lgpd',
    activePageKey: 'Hero_Lgpd',
    getLatestCol: getCorpoLgpdCollection,
    getAckCol: getLgpdAckCollection,
  },
  {
    type: 'termo-usuario',
    label: 'Termos de Uso',
    path: '/portal/termo-usuario',
    activePageKey: 'Hero_TermoUsuario',
    getLatestCol: getCorpoTermoUsuarioCollection,
    getAckCol: getTermoUsuarioAckCollection,
  },
];

/** Ciência por acordeão em Políticas e Normas (espelha src/config/politicasNormasAccordions.js) */
const POLITICAS_ACCORDION_COMPLIANCE = [
  {
    type: 'etica-conduta',
    accordionId: 'codigo-etica-conduta',
    label: 'Código de Ética e Conduta',
    path: '/portal/politicas-normas',
    activePageKey: 'Hero_PoliticasNormas',
    getLatestCol: getCorpoEticaCondutaCollection,
    getAckCol: getEticaCondutaAckCollection,
  },
];

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
const initHubCorporateRoutes = (mongoClient, connectToMongo) => {
  const router = express.Router();

  async function getLatestDoc(getCollection) {
    await connectToMongo();
    const col = getCollection(mongoClient);
    return col.find({}).sort({ createdAt: -1 }).limit(1).next();
  }

  async function getAcknowledgedVersaoIds(getAckCollection, userEmail) {
    await connectToMongo();
    const col = getAckCollection(mongoClient);
    const normalized = String(userEmail || '').trim().toLowerCase();
    const rows = await col.find({ userEmail: normalized }).toArray();
    return rows.map((r) => String(r.versao));
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {() => import('mongodb').Collection} getLatestCol
   */
  async function handleLatest(req, res, getLatestCol) {
    try {
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }
      const doc = await getLatestDoc(getLatestCol);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Conteúdo não encontrado' });
      }
      return res.json({ success: true, data: doc });
    } catch (error) {
      console.error('[corporate/latest]', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {() => import('mongodb').Collection} getAckCol
   */
  async function handleAcknowledgments(req, res, getAckCol) {
    try {
      const { userEmail } = req.params;
      if (!userEmail) {
        return res.status(400).json({ success: false, message: 'userEmail é obrigatório' });
      }
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }
      const acknowledgedVersaoIds = await getAcknowledgedVersaoIds(getAckCol, userEmail);
      return res.json({ success: true, acknowledgedVersaoIds });
    } catch (error) {
      console.error('[corporate/acknowledgments]', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {() => import('mongodb').Collection} getAckCol
   */
  async function handleAcknowledge(req, res, getAckCol) {
    try {
      const { versaoId } = req.params;
      const { userId, userName } = req.body || {};
      if (!userId || !versaoId) {
        return res.status(400).json({ success: false, message: 'userId e versaoId são obrigatórios' });
      }
      if (!ObjectId.isValid(versaoId)) {
        return res.status(400).json({ success: false, message: 'versaoId inválido' });
      }
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }

      await connectToMongo();
      const col = getAckCol(mongoClient);
      const userEmail = String(userId).trim().toLowerCase();
      const versao = new ObjectId(versaoId);

      const existing = await col.findOne({ versao, userEmail });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Ciência já registrada para esta versão' });
      }

      const now = new Date();
      const result = await col.insertOne({
        colaboradorNome: userName || 'Usuário',
        userEmail,
        versao,
        acknowledgedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        success: true,
        message: 'Ciência registrada com sucesso',
        acknowledgeId: result.insertedId,
      });
    } catch (error) {
      console.error('[corporate/acknowledge]', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  router.get('/etica-conduta/latest', (req, res) =>
    handleLatest(req, res, getCorpoEticaCondutaCollection)
  );
  router.get('/etica-conduta/acknowledgments/:userEmail', (req, res) =>
    handleAcknowledgments(req, res, getEticaCondutaAckCollection)
  );
  router.post('/etica-conduta/:versaoId/acknowledge', (req, res) =>
    handleAcknowledge(req, res, getEticaCondutaAckCollection)
  );

  router.get('/politicas-normas/latest', (req, res) =>
    handleLatest(req, res, getCorpoEticaCondutaCollection)
  );
  router.get('/politicas-normas/acknowledgments/:userEmail', (req, res) =>
    handleAcknowledgments(req, res, getEticaCondutaAckCollection)
  );
  router.post('/politicas-normas/:versaoId/acknowledge', (req, res) =>
    handleAcknowledge(req, res, getEticaCondutaAckCollection)
  );

  router.get('/lgpd/latest', (req, res) => handleLatest(req, res, getCorpoLgpdCollection));
  router.get('/lgpd/acknowledgments/:userEmail', (req, res) =>
    handleAcknowledgments(req, res, getLgpdAckCollection)
  );
  router.post('/lgpd/:versaoId/acknowledge', (req, res) =>
    handleAcknowledge(req, res, getLgpdAckCollection)
  );

  router.get('/termo-usuario/latest', (req, res) =>
    handleLatest(req, res, getCorpoTermoUsuarioCollection)
  );
  router.get('/termo-usuario/acknowledgments/:userEmail', (req, res) =>
    handleAcknowledgments(req, res, getTermoUsuarioAckCollection)
  );
  router.post('/termo-usuario/:versaoId/acknowledge', (req, res) =>
    handleAcknowledge(req, res, getTermoUsuarioAckCollection)
  );

  router.get('/compliance/pending', async (req, res) => {
    try {
      const userEmail = req.query.userEmail;
      if (!userEmail) {
        return res.status(400).json({ success: false, message: 'userEmail é obrigatório' });
      }
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado' });
      }

      const pending = [];
      const normalized = String(userEmail).trim().toLowerCase();

      for (const accordion of POLITICAS_ACCORDION_COMPLIANCE) {
        const latest = await getLatestDoc(accordion.getLatestCol);
        if (!latest?._id) continue;

        const ackIds = await getAcknowledgedVersaoIds(accordion.getAckCol, normalized);
        const versaoId = latest._id.toString();
        if (!ackIds.includes(versaoId)) {
          pending.push({
            type: accordion.type,
            accordionId: accordion.accordionId,
            versaoId,
            label: accordion.label,
            path: accordion.path,
            activePageKey: accordion.activePageKey,
          });
        }
      }

      for (const item of COMPLIANCE_ITEMS) {
        const latest = await getLatestDoc(item.getLatestCol);
        if (!latest?._id) continue;

        const ackIds = await getAcknowledgedVersaoIds(item.getAckCol, normalized);
        const versaoId = latest._id.toString();
        if (!ackIds.includes(versaoId)) {
          pending.push({
            type: item.type,
            versaoId,
            label: item.label,
            path: item.path,
            activePageKey: item.activePageKey,
          });
        }
      }

      return res.json({ success: true, pending });
    } catch (error) {
      console.error('[corporate/compliance/pending]', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};

module.exports = { initHubCorporateRoutes };
