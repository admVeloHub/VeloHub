/**
 * VeloHub V3 — API Conhecimento — hub_documentos
 * VERSION: v1.0.0 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team
 *
 * Collection: console_conteudo.hub_documentos
 * Schema: titulo, body, categoria, createdAt, updatedAt
 */

const express = require('express');

const HUB_DOCUMENTOS_COLLECTION = 'hub_documentos';

/**
 * @param {import('mongodb').Document} doc
 */
function mapHubDocumento(doc) {
  return {
    _id: doc._id,
    title: doc.titulo != null ? String(doc.titulo).trim() : '',
    content: doc.body != null ? String(doc.body) : '',
    category: doc.categoria != null ? String(doc.categoria).trim() : '',
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? doc.createdAt ?? null,
  };
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
const initHubDocumentosRoutes = (mongoClient, connectToMongo) => {
  const router = express.Router();

  router.get('/categories', async (req, res) => {
    try {
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', data: [] });
      }

      await connectToMongo();
      const db = mongoClient.db('console_conteudo');
      const collection = db.collection(HUB_DOCUMENTOS_COLLECTION);

      const distinct = await collection.distinct('categoria', {
        categoria: { $exists: true, $nin: [null, ''] },
      });

      const sorted = distinct
        .map((c) => String(c).trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

      const data = sorted.map((categoria, index) => ({
        categoria_id: categoria,
        categoria_titulo: categoria,
        ordem: index,
      }));

      return res.json({ success: true, data });
    } catch (error) {
      console.error('[hub-documentos/categories]', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar categorias de documentos',
        error: error.message,
        data: [],
      });
    }
  });

  router.get('/', async (req, res) => {
    try {
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', data: [] });
      }

      await connectToMongo();
      const db = mongoClient.db('console_conteudo');
      const collection = db.collection(HUB_DOCUMENTOS_COLLECTION);

      const docs = await collection
        .find({})
        .sort({ createdAt: -1, updatedAt: -1, _id: -1 })
        .toArray();

      return res.json({
        success: true,
        data: docs.map(mapHubDocumento),
      });
    } catch (error) {
      console.error('[hub-documentos]', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documentos',
        error: error.message,
        data: [],
      });
    }
  });

  return router;
};

module.exports = {
  initHubDocumentosRoutes,
  mapHubDocumento,
  HUB_DOCUMENTOS_COLLECTION,
};
