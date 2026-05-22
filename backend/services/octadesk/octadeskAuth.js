/**
 * Autenticação JWT Octadesk (Bearer).
 * VERSION: v1.0.0 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * POST /login ou /login/apiToken conforme credenciais em config.
 */

const fetch = require('node-fetch');
const config = require('../../config');

/** @type {{ token: string, expiresAtMs: number } | null} */
let cache = null;

function getApiRoot() {
  const raw =
    config.OCTADESK_API_BASE_URL != null ? String(config.OCTADESK_API_BASE_URL).trim() : '';
  const base = raw || 'https://api.octadesk.services';
  return base.replace(/\/+$/, '');
}

/**
 * @returns {boolean}
 */
function isOctadeskConfigured() {
  const token = config.OCTADESK_API_TOKEN != null ? String(config.OCTADESK_API_TOKEN).trim() : '';
  const email = config.OCTADESK_API_EMAIL != null ? String(config.OCTADESK_API_EMAIL).trim() : '';
  const pass =
    config.OCTADESK_API_PASSWORD != null ? String(config.OCTADESK_API_PASSWORD).trim() : '';
  return Boolean(token || (email && pass));
}

/**
 * @param {Response} res
 * @returns {Promise<Record<string, unknown>>}
 */
async function parseJsonSafe(res) {
  try {
    return /** @type {Record<string, unknown>} */ (await res.json());
  } catch {
    return {};
  }
}

/**
 * Extrai JWT e expiry da resposta de login.
 * @param {Record<string, unknown>} body
 * @returns {{ token: string, expiresAtMs: number }}
 */
function extractTokenFromLoginBody(body) {
  const token =
    (body.token != null ? String(body.token) : '') ||
    (body.accessToken != null ? String(body.accessToken) : '') ||
    (body.access_token != null ? String(body.access_token) : '') ||
    (typeof body.data === 'object' && body.data && body.data.token != null
      ? String(body.data.token)
      : '');
  if (!token) {
    throw new Error('Resposta de login Octadesk sem token');
  }
  const expiresInSec =
    Number(body.expiresIn) ||
    Number(body.expires_in) ||
    (typeof body.data === 'object' && body.data ? Number(body.data.expiresIn) : 0) ||
    3600;
  const expiresAtMs = Date.now() + Math.max(300, expiresInSec) * 1000 - 120000;
  return { token, expiresAtMs };
}

/**
 * @returns {Promise<string>}
 */
async function fetchNewToken() {
  const root = getApiRoot();
  const apiToken = config.OCTADESK_API_TOKEN != null ? String(config.OCTADESK_API_TOKEN).trim() : '';

  if (apiToken) {
    const url = `${root}/login/apiToken`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ apiToken }),
    });
    const rawText = await res.clone().text().catch(() => '');
    const body = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(
        `Octadesk login/apiToken HTTP ${res.status}: ${body.message || body.error || res.statusText}`
      );
    }
    const { token, expiresAtMs } = extractTokenFromLoginBody(body);
    cache = { token, expiresAtMs };
    return token;
  }

  const email = config.OCTADESK_API_EMAIL != null ? String(config.OCTADESK_API_EMAIL).trim() : '';
  const password =
    config.OCTADESK_API_PASSWORD != null ? String(config.OCTADESK_API_PASSWORD).trim() : '';
  if (!email || !password) {
    throw new Error('Octadesk: defina OCTADESK_API_TOKEN ou OCTADESK_API_EMAIL + OCTADESK_API_PASSWORD');
  }

  const url = `${root}/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(`Octadesk login HTTP ${res.status}: ${body.message || body.error || res.statusText}`);
  }
  const { token, expiresAtMs } = extractTokenFromLoginBody(body);
  cache = { token, expiresAtMs };
  return token;
}

/**
 * Bearer JWT para Authorization header.
 * @returns {Promise<string>}
 */
async function getBearerToken() {
  if (!isOctadeskConfigured()) {
    throw new Error('Octadesk não configurado');
  }
  if (cache && cache.token && Date.now() < cache.expiresAtMs) {
    return cache.token;
  }
  return fetchNewToken();
}

function clearOctadeskTokenCache() {
  cache = null;
}

module.exports = {
  getApiRoot,
  isOctadeskConfigured,
  getBearerToken,
  clearOctadeskTokenCache,
};
