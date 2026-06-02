/**
 * VeloHub V3 — API Home Destaques (somente carrossel banner)
 * VERSION: v1.3.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.3.0 - Feed removido (avisos em /api/home/avisos/feed → hub_avisos); só GET /carousel
 * - v1.1.0: Carrossel — console_conteudo.hub_banner (bannerImg[])
 */

const express = require('express');

const GCS_IMAGE_API_PREFIX = 'mediabank_velohub/img_destaques/';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * @param {unknown} item
 */
function normalizeBannerItem(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    return { url: item, name: item, type: 'image' };
  }
  if (typeof item === 'object') {
    return {
      url: item.url ?? item.path ?? null,
      name: item.name ?? null,
      type: item.type ?? 'image',
      href: item.href ?? null,
    };
  }
  return null;
}

/**
 * bannerImg: array [{ url, type, name }] ou mapa img1, img2…
 * @param {unknown} bannerImg
 */
function normalizeBannerImg(bannerImg) {
  if (!bannerImg) return [];
  if (Array.isArray(bannerImg)) {
    return bannerImg.map(normalizeBannerItem).filter(Boolean);
  }
  if (typeof bannerImg === 'object') {
    return Object.values(bannerImg)
      .map(normalizeBannerItem)
      .filter(Boolean);
  }
  return [];
}

/**
 * @param {{ url?: string|null, name?: string|null }} item
 * @param {string} apiBaseUrl
 */
function resolveBannerSlideUrl(item, apiBaseUrl) {
  const raw = (item.url || item.name || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  let path = raw.replace(/^\//, '');
  if (!path.includes('/')) {
    path = `${GCS_IMAGE_API_PREFIX}${path}`;
  }
  if (path.startsWith('mediabank_velohub/') || path.startsWith('img_')) {
    const encoded = path.split('/').map((part) => encodeURIComponent(part)).join('/');
    return `${apiBaseUrl}/images/${encoded}`;
  }
  const encoded = `${GCS_IMAGE_API_PREFIX}${path}`.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `${apiBaseUrl}/images/${encoded}`;
}

/**
 * @param {unknown} item
 */
function isDisplayableBannerItem(item) {
  const type = String(item.type || '').toLowerCase();
  if (type && !type.startsWith('image') && type !== 'img') return false;
  const path = String(item.url || item.name || '').toLowerCase();
  if (!path) return false;
  if (/^https?:\/\//i.test(path)) return true;
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext)) || !type;
}

/**
 * @param {import('mongodb').Document} doc
 * @param {string} apiBaseUrl
 */
function mapHubBannerDocToSlides(doc, apiBaseUrl) {
  const docId = doc._id?.toString?.() ?? 'banner';
  return normalizeBannerImg(doc.bannerImg)
    .filter(isDisplayableBannerItem)
    .map((item, index) => {
      const url = resolveBannerSlideUrl(item, apiBaseUrl);
      if (!url) return null;
      const fileName = item.name || item.url || `${docId}-${index}`;
      return {
        id: `${docId}-${index}`,
        fileName,
        order: index,
        href: item.href ?? null,
        url,
        name: item.name ?? null,
      };
    })
    .filter(Boolean);
}

/**
 * @param {import('mongodb').MongoClient} mongoClient
 * @param {() => Promise<import('mongodb').MongoClient>} connectToMongo
 */
const initHomeDestaquesRoutes = (mongoClient, connectToMongo) => {
  const router = express.Router();

  router.get('/carousel', async (req, res) => {
    try {
      if (!mongoClient) {
        return res.status(503).json({ success: false, message: 'MongoDB não configurado', slides: [] });
      }

      await connectToMongo();
      const db = mongoClient.db('console_conteudo');
      const bannerDocs = await db
        .collection('hub_banner')
        .find({})
        .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
        .toArray();

      const apiBase = `${req.protocol}://${req.get('host')}/api`;
      const slides = bannerDocs.flatMap((doc) => mapHubBannerDocToSlides(doc, apiBase));

      return res.json({ success: true, slides });
    } catch (error) {
      console.error('[home/destaques/carousel]', error);
      return res.status(500).json({ success: false, message: error.message, slides: [] });
    }
  });

  return router;
};

module.exports = {
  initHomeDestaquesRoutes,
  normalizeBannerImg,
  resolveBannerSlideUrl,
  mapHubBannerDocToSlides,
};
