/**
 * VeloHub V3 — API Home Avisos (feed central — console_conteudo.hub_avisos)
 * VERSION: v1.2.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 */

const express = require('express');

const HUB_AVISOS_COLLECTION = 'hub_avisos';

/**
 * hub_avisos.media: array [{ url, type, name }] — normaliza para { images, videos } da API
 * @param {unknown} media
 */
function normalizeAvisosMedia(media) {
  const result = { images: [], videos: [] };
  if (Array.isArray(media)) {
    for (const entry of media) {
      if (!entry) continue;
      if (typeof entry === 'string') {
        result.images.push(entry);
        continue;
      }
      if (typeof entry === 'object') {
        const type = String(entry.type || '').toLowerCase();
        if (type.startsWith('video') || type === 'youtube') {
          result.videos.push(entry);
        } else {
          result.images.push(entry.url ?? entry.name ?? entry);
        }
      }
    }
    return result;
  }
  if (media && typeof media === 'object') {
    if (Array.isArray(media.images)) result.images = media.images;
    if (Array.isArray(media.videos)) result.videos = media.videos;
  }
  return result;
}

/**
 * @param {object} item
 * @param {(text: string) => string} parseTextContent
 */
function mapAvisoFeedItem(item, parseTextContent) {
  const createdAt =
    item.createdAt ??
    (item._id && item._id.getTimestamp ? item._id.getTimestamp() : null);

  return {
    _id: item._id,
    title: item.titulo ?? '(sem título)',
    content: parseTextContent(item.conteudo ?? ''),
    media: normalizeAvisosMedia(item.media),
    createdAt,
  };
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 * @param {(text: string) => string} parseTextContent
 */
const initHomeAvisosRoutes = (mongoClient, connectToMongo, parseTextContent) => {
  const router = express.Router();

  router.get('/feed', async (req, res) => {
    try {
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', data: [] });
      }

      await connectToMongo();
      const db = mongoClient.db('console_conteudo');
      const collection = db.collection(HUB_AVISOS_COLLECTION);

      const limit = parseInt(req.query.limit, 10) || null;
      const skip = parseInt(req.query.skip, 10) || 0;

      let cursor = collection.find({}).sort({ createdAt: -1, _id: -1 });
      if (skip > 0) cursor = cursor.skip(skip);
      if (limit && limit > 0) cursor = cursor.limit(limit);

      const raw = await cursor.toArray();
      let totalCount = null;
      if (limit !== null) {
        totalCount = await collection.countDocuments({});
      }

      const mapped = raw.map((item) => mapAvisoFeedItem(item, parseTextContent));
      const response = { success: true, data: mapped };
      if (limit !== null && totalCount !== null) {
        response.pagination = {
          total: totalCount,
          limit,
          skip,
          hasMore: skip + mapped.length < totalCount,
        };
      }
      return res.json(response);
    } catch (error) {
      console.error('[home/avisos/feed]', error);
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }
  });

  return router;
};

module.exports = {
  initHomeAvisosRoutes,
  mapAvisoFeedItem,
  normalizeAvisosMedia,
  HUB_AVISOS_COLLECTION,
};
