/**
 * VeloHub V3 — Status efetivo do array reply (Req_Prod / liberacao_pix_prod)
 * VERSION: v1.0.1 | DATE: 2026-05-15 | AUTHOR: VeloHub Development Team
 *
 * Espelha a lógica de getStatusChamado em src/utils/requisicoesModalHelpers.js (Node).
 */

/**
 * @param {unknown} at
 * @returns {number}
 */
function parseReplyAtMs(at) {
  if (at == null || at === '') return 0;
  const t = new Date(at).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * @param {Record<string, unknown>|null|undefined} doc
 * @returns {{ status: string, atMs: number }}
 */
function getStatusChamadoFromDoc(doc) {
  const reply = Array.isArray(doc?.reply) ? doc.reply : [];
  if (reply.length === 0) return { status: 'enviado', atMs: 0 };

  const withStatus = reply
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => String(item?.status || '').trim() !== '');
  if (withStatus.length === 0) return { status: 'enviado', atMs: 0 };

  withStatus.sort((a, b) => {
    const ta = parseReplyAtMs(a.item?.at);
    const tb = parseReplyAtMs(b.item?.at);
    if (ta !== tb) return ta - tb;
    return a.i - b.i;
  });

  const chosen = withStatus[withStatus.length - 1].item;
  const s = String(chosen?.status || '').toLowerCase();
  let status = 'enviado';
  if (s === 'cancelado') status = 'Cancelado';
  else if (['enviado', 'feito', 'não feito', 'nao feito'].includes(s)) {
    status = s === 'nao feito' ? 'não feito' : s;
  }
  const atMs = parseReplyAtMs(chosen?.at);
  return { status, atMs };
}

module.exports = {
  parseReplyAtMs,
  getStatusChamadoFromDoc,
};
