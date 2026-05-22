/**
 * Resolve número de ticket Octadesk a partir de reclamação ou requisição.
 * VERSION: v1.0.0 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Prioridade (reclamação): ticketRegistro → protocolosCentral[0] → protocolosN2[0]
 * Requisição/erros-bugs: protocolosCentral[0]
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
  const n1 = firstNonEmptyProtocol(doc.protocolosCentral);
  if (n1) return n1;
  return firstNonEmptyProtocol(doc.protocolosN2);
}

/**
 * Número do ticket Octadesk em documento de requisição (solicitações / erros-bugs).
 * @param {Record<string, unknown>|null|undefined} doc
 * @returns {string}
 */
function resolveOctadeskTicketFromRequisicao(doc) {
  if (!doc || typeof doc !== 'object') return '';
  return firstNonEmptyProtocol(doc.protocolosCentral);
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
  resolveOctadeskTicketFromReclamacao,
  resolveOctadeskTicketFromRequisicao,
  normalizeProtocolosCentralInput,
  validateProtocolosCentralRequired,
};
