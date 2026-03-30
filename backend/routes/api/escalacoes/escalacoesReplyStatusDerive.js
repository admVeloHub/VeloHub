/**
 * VeloHub V3 - Escalações: derivação de status do chamado (paridade com frontend)
 * VERSION: v1.0.0 | DATE: 2026-03-30 | AUTHOR: VeloHub Development Team
 *
 * Espelha a lógica de `getStatusChamado` em `src/utils/escalacoesModalHelpers.js`
 * para filtros server-side em rotas restritas (ex.: Apoio N1).
 */

function parseReplyAtMs(at) {
  if (at == null || at === '') return 0;
  const t = new Date(at).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * @param {object} doc - documento solicitacao_tecnica ou erro_bug
 * @returns {string} enviado | feito | não feito | Cancelado
 */
function getStatusChamadoFromDoc(doc) {
  const reply = Array.isArray(doc?.reply) ? doc.reply : [];
  if (reply.length === 0) return 'enviado';

  const withStatus = reply
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => String(item?.status || '').trim() !== '');
  if (withStatus.length === 0) return 'enviado';

  withStatus.sort((a, b) => {
    const ta = parseReplyAtMs(a.item?.at);
    const tb = parseReplyAtMs(b.item?.at);
    if (ta !== tb) return ta - tb;
    return a.i - b.i;
  });

  const chosen = withStatus[withStatus.length - 1].item;
  const s = String(chosen?.status || '').toLowerCase();
  if (s === 'cancelado') return 'Cancelado';
  if (['enviado', 'feito', 'não feito', 'nao feito'].includes(s)) {
    return s === 'nao feito' ? 'não feito' : s;
  }
  return 'enviado';
}

function normalizeReplyArrays(doc) {
  const d = doc && typeof doc === 'object' ? doc : {};
  if (!Array.isArray(d.replies)) d.replies = [];
  if (!Array.isArray(d.reply)) d.reply = [];
  return d;
}

module.exports = {
  getStatusChamadoFromDoc,
  normalizeReplyArrays,
};
