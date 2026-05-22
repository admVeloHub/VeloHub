/**
 * VeloHub V3 — Leitura de notificação «Feito» Req_Prod ligado à Ouvidoria (Minhas / header)
 * VERSION: v1.0.0 | DATE: 2026-04-22 | AUTHOR: VeloHub Development Team
 */

export const STORAGE_OUVID_REQPROD_FEITO_READ = 'velohub_ouvid_reqprod_feito_read_v1';

function loadMap() {
  try {
    const s = localStorage.getItem(STORAGE_OUVID_REQPROD_FEITO_READ);
    if (!s) return {};
    const j = JSON.parse(s);
    return j && typeof j === 'object' ? j : {};
  } catch {
    return {};
  }
}

function saveMap(m) {
  try {
    localStorage.setItem(STORAGE_OUVID_REQPROD_FEITO_READ, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

/**
 * @param {string|undefined|null} liberacaoId
 * @returns {number} ms reconhecidos pelo utilizador (0 = nunca)
 */
export function getOuvidReqProdFeitoReadMs(liberacaoId) {
  const id = String(liberacaoId || '').trim();
  if (!id) return 0;
  const m = loadMap();
  const v = m[id];
  return typeof v === 'number' && v > 0 ? v : 0;
}

/**
 * @param {string|undefined|null} liberacaoId
 * @param {number} statusAtMs — timestamp do reply vencedor (Feito)
 */
export function markOuvidReqProdFeitoRead(liberacaoId, statusAtMs) {
  const id = String(liberacaoId || '').trim();
  if (!id || !Number.isFinite(statusAtMs) || statusAtMs <= 0) return;
  const m = loadMap();
  m[id] = statusAtMs;
  saveMap(m);
}

/**
 * @param {Record<string, unknown>} item — linha de reclamação com reqProd* da API
 * @returns {boolean}
 */
export function isUnreadFeitoOuvidReqProd(item) {
  if (!item) return false;
  if (String(item.reqProdStatusEfetivo || '').toLowerCase() !== 'feito') return false;
  const lib = item.reqProdLiberacaoPix;
  const libId = lib?._id != null ? String(lib._id) : '';
  if (!libId) return false;
  const at = item.reqProdStatusAt;
  const atMs = at ? new Date(at).getTime() : 0;
  if (!Number.isFinite(atMs) || atMs <= 0) return false;
  return atMs > getOuvidReqProdFeitoReadMs(libId);
}

/**
 * @param {Array<Record<string, unknown>>|undefined} reclamacoes
 * @returns {number}
 */
export function countUnreadFeitoOuvidReqProd(reclamacoes) {
  if (!Array.isArray(reclamacoes)) return 0;
  return reclamacoes.filter(isUnreadFeitoOuvidReqProd).length;
}
