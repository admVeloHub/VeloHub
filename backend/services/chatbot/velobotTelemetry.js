/**
 * Telemetria opcional do chat principal VeloBot (webhook externo)
 * VERSION: v1.0.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 */

const fetch = require('node-fetch');
const config = require('../../config');

/**
 * Identificador truncado para logs externos (sem expor e-mail completo).
 * @param {string|null|undefined} userId
 * @returns {string}
 */
function truncateUserIdForTelemetry(userId) {
  const s = userId != null ? String(userId).trim() : '';
  if (!s) return 'anonymous';
  if (s.length <= 8) return s;
  return s.slice(0, 4) + '…' + s.slice(-4);
}

/**
 * Envia evento ao webhook configurado (fire-and-forget).
 * @param {Object} event
 */
function emitVelobotEvent(event) {
  const url = config.VELOBOT_TELEMETRY_WEBHOOK_URL;
  if (url == null || String(url).trim() === '') return;

  const headers = { 'Content-Type': 'application/json' };
  const secret = config.VELOBOT_TELEMETRY_WEBHOOK_SECRET;
  if (secret != null && String(secret).trim() !== '') {
    headers.Authorization = 'Bearer ' + String(secret).trim();
  }

  const payload = {
    service: 'velohub-velobot',
    timestamp: new Date().toISOString(),
    ...event
  };

  fetch(String(url).trim(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  }).catch((err) => {
    console.warn('VeloBot Telemetry: webhook falhou:', err.message);
  });
}

module.exports = {
  emitVelobotEvent,
  truncateUserIdForTelemetry
};
