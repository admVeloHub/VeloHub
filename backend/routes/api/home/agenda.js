/**
 * VeloHub V3 — API Home Agenda (compromissos MongoDB)
 * VERSION: v1.1.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 */

const express = require('express');
const HUB_AGENDA_COLLECTION = 'hub_agenda';

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
const initHomeAgendaRoutes = (mongoClient, connectToMongo) => {
  const router = express.Router();

  const loadEventos = async (req, res) => {
    try {
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', data: [] });
      }
      await connectToMongo();
      const db = mongoClient.db('console_conteudo');
      const limit = parseInt(req.query.limit, 10) || 4;
      const now = new Date();

      const rows = await db
        .collection(HUB_AGENDA_COLLECTION)
        .find({ ativo: { $ne: false }, inicio: { $gte: now } })
        .sort({ inicio: 1 })
        .limit(limit)
        .toArray();

      const data = rows.map((item) => ({
        id: String(item._id),
        titulo: item.titulo,
        inicio: item.inicio,
        url: item.url || '',
      }));

      return res.json({ success: true, data });
    } catch (error) {
      console.error('[home/agenda/eventos]', error);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }
  };

  router.get('/', loadEventos);
  router.get('/eventos', loadEventos);

  return router;
};

module.exports = { initHomeAgendaRoutes, HUB_AGENDA_COLLECTION };
