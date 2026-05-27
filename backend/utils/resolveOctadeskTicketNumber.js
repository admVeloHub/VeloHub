/**
 * Resolve número de ticket Octadesk a partir de reclamação ou requisição.
 * VERSION: v1.0.2 | DATE: 2026-05-22 | AUTHOR: VeloHub Development Team
 *
 * - v1.0.2: requisição/liberação — protocolosCentral[0]; ouvidoriaNumeroProtocolo se for número Octadesk;
 *   lookup assíncrono ticketRegistro na reclamação vinculada (liberação PIX)
 * - v1.0.1: protocoloOctadesk (Time Portabilidade) na cadeia de resolução
 * Prioridade (reclamação): ticketRegistro → protocoloOctadesk → protocolosCentral[0] → protocolosN2[0]
 */

/**
 * Primeiro protocolo não vazio de um array.
 * @param {unknown} arr
 * @returns {string}
 */
function firstNonEmptyProtocol(arr) {
  if (!Array.isArray(arr)) return '';
  for (const p of arr) {
    const s = String(p != null ? p : '').trim();
    if (s) return s;
  }
  return '';
}

/**
 * Número do ticket Octadesk para PUT na API (reclamação).
 * @param {Record<string, unknown>|null|undefined} doc
 * @returns {string}
 */
function resolveOctadeskTicketFromReclamacao(doc) {
  if (!doc || typeof doc !== 'object') return '';
  const reg = String(doc.ticketRegistro != null ? doc.ticketRegistro : '').trim();
  if (reg) return reg;
  const octa = String(doc.protocoloOctadesk != null ? doc.protocoloOctadesk : '').trim();
  if (octa) return octa;
  const n1 = firstNonEmptyProtocol(doc.protocolosCentral);
  if (n1) return n1;
  return firstNonEmptyProtocol(doc.protocolosN2);
}

/**
 * Número exibido no painel Octadesk (somente dígitos, comprimento típico ≥ 5).
 * @param {unknown} raw
 * @returns {boolean}
 */
function looksLikeOctadeskTicketNumber(raw) {
  const t = String(raw != null ? raw : '').trim();
  if (!/^\d+$/.test(t)) return false;
  return t.length >= 5;
}

/**
 * Número do ticket Octadesk em documento de requisição (solicitações / erros-bugs / liberação PIX).
 * @param {Record<string, unknown>|null|undefined} doc
 * @returns {string}
 */
function resolveOctadeskTicketFromRequisicao(doc) {
  if (!doc || typeof doc !== 'object') return '';
  const central = firstNonEmptyProtocol(doc.protocolosCentral);
  if (central && looksLikeOctadeskTicketNumber(central)) return central;
  const hint = String(doc.ouvidoriaNumeroProtocolo != null ? doc.ouvidoriaNumeroProtocolo : '').trim();
  if (looksLikeOctadeskTicketNumber(hint)) return hint;
  const reg = String(doc.ticketRegistro != null ? doc.ticketRegistro : '').trim();
  if (looksLikeOctadeskTicketNumber(reg)) return reg;
  if (central) return central;
  return '';
}

/**
 * Liberação PIX: protocolosCentral / campo enviado pelo modal Ouvidoria / ticketRegistro na reclamação vinculada.
 * @param {import('mongodb').MongoClient|null} client
 * @param {() => Promise<void>} connectToMongo
 * @param {Record<string, unknown>|null|undefined} libDoc
 * @returns {Promise<string>}
 */
async function resolveOctadeskTicketForLiberacaoPix(client, connectToMongo, libDoc) {
  const sync = resolveOctadeskTicketFromRequisicao(libDoc);
  if (sync) return sync;

  if (!client || !libDoc || typeof libDoc !== 'object') return '';

  const rawId = libDoc.ouvidoriaReclamacaoId;
  const tipo = libDoc.ouvidoriaReclamacaoTipo;
  if (rawId == null || !String(tipo || '').trim()) return '';

  const { ObjectId } = require('mongodb');
  const { getHubOuvidoriaReclamacaoCollectionByTipo } = require('./hubOuvidoriaReclamacaoCollectionByTipo');

  let oid = rawId;
  if (!(oid instanceof ObjectId)) {
    const s = String(rawId).trim();
    if (!ObjectId.isValid(s)) return '';
    oid = new ObjectId(s);
  }

  try {
    await connectToMongo();
    const ouvDb = client.db('hub_ouvidoria');
    const coll = getHubOuvidoriaReclamacaoCollectionByTipo(ouvDb, String(tipo));
    const rec = await coll.findOne(
      { _id: oid },
      { projection: { ticketRegistro: 1, protocoloOctadesk: 1, protocolosCentral: 1, protocolosN2: 1 } }
    );
    return resolveOctadeskTicketFromReclamacao(rec || {});
  } catch (err) {
    console.warn('[resolveOctadeskTicketForLiberacaoPix]', err?.message || err);
    return '';
  }
}

/**
 * Normaliza body protocolosCentral para array de strings não vazias.
 * @param {unknown} raw — string ou array
 * @returns {string[]}
 */
function normalizeProtocolosCentralInput(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p != null ? p : '').trim()).filter(Boolean);
  }
  const one = String(raw).trim();
  return one ? [one] : [];
}

/**
 * Valida presença de pelo menos um ticket.
 * @param {unknown} raw
 * @returns {{ ok: boolean, values: string[], message?: string }}
 */
function validateProtocolosCentralRequired(raw) {
  const values = normalizeProtocolosCentralInput(raw);
  if (values.length === 0) {
    return {
      ok: false,
      values: [],
      message: 'Campo obrigatório: Ticket (protocolosCentral)',
    };
  }
  return { ok: true, values };
}

module.exports = {
  firstNonEmptyProtocol,
  looksLikeOctadeskTicketNumber,
  resolveOctadeskTicketFromReclamacao,
  resolveOctadeskTicketFromRequisicao,
  resolveOctadeskTicketForLiberacaoPix,
  normalizeProtocolosCentralInput,
  validateProtocolosCentralRequired,
};
