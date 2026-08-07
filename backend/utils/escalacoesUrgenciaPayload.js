/**
 * Flags de «Solicitação Urgente» em requisições (Req_Prod).
 * VERSION: v1.0.0 | DATE: 2026-08-07 | AUTHOR: VeloHub Development Team
 */

const URGENCIA_DEFS = [
  { key: 'urgenciaN2', tag: 'N2' },
  { key: 'urgenciaRa', tag: 'RA' },
  { key: 'urgenciaBacen', tag: 'Bacen' },
  { key: 'urgenciaProcon', tag: 'ProCon' },
  { key: 'urgenciaJudicial', tag: 'Judicial' },
];

const URGENCIA_KEYS = URGENCIA_DEFS.map((d) => d.key);

/**
 * Extrai somente flags de urgência marcadas (true).
 * @param {Record<string, unknown>} [source]
 * @returns {Record<string, true>}
 */
function extractUrgenciaFlags(source = {}) {
  const out = {};
  for (const { key } of URGENCIA_DEFS) {
    if (source[key] === true) out[key] = true;
  }
  return out;
}

/**
 * Normaliza payload: mantém flags de urgência apenas quando true; remove false/undefined.
 * @param {Record<string, unknown>} [payload]
 * @returns {Record<string, unknown>}
 */
function normalizePayloadUrgencia(payload = {}) {
  const out = { ...payload };
  for (const { key } of URGENCIA_DEFS) {
    if (out[key] === true) {
      out[key] = true;
    } else {
      delete out[key];
    }
  }
  return out;
}

/**
 * Linha de tags para mensagem Octadesk / WhatsApp (fallback quando não há mensagemTexto).
 * @param {Record<string, unknown>} [source]
 * @returns {string}
 */
function buildUrgenciaTagsLine(source = {}) {
  const tags = URGENCIA_DEFS.filter(({ key }) => source[key] === true).map(({ tag }) => tag);
  if (!tags.length) return '';
  return `\n*Solicitação urgente*: ${tags.join(', ')}\n`;
}

module.exports = {
  URGENCIA_KEYS,
  URGENCIA_DEFS,
  extractUrgenciaFlags,
  normalizePayloadUrgencia,
  buildUrgenciaTagsLine,
};
