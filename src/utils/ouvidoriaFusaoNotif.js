/**
 * VeloHub V3 — Leitura «fundido/absorvido por fusão» (Minhas + bolha «Reclamações» no header)
 * VERSION: v1.2.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 */

export const STORAGE_OUVID_FUSAO_ABS_ACK = 'velohub_ouvid_fusao_abs_ack_v1';

function loadMap() {
  try {
    const s = localStorage.getItem(STORAGE_OUVID_FUSAO_ABS_ACK);
    if (!s) return {};
    const j = JSON.parse(s);
    return j && typeof j === 'object' ? j : {};
  } catch {
    return {};
  }
}

function saveMap(m) {
  try {
    localStorage.setItem(STORAGE_OUVID_FUSAO_ABS_ACK, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

/** @param {unknown} ms */
export function fusaoFundidoAckEventMs(ms) {
  const n = Number(ms);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** @param {Record<string, unknown>} item */
export function fusaoFundidoEventMs(item) {
  const f = item?.Fusao?.dataFundido;
  if (!f) return 0;
  const t = new Date(f).getTime();
  return Number.isFinite(t) && t > 0 ? t : 0;
}

/**
 * Ocorrência passiva/absorvida (alvo da fusão) — inclui redundante como filho (`parentId`).
 * @param {Record<string, unknown>|null|undefined} item
 * @returns {boolean}
 */
export function isFusaoAbsorvoAlvo(item) {
  if (!item || typeof item !== 'object') return false;
  const fu = item.Fusao;
  if (!fu || fu.fundido !== true) return false;
  const h = String(fu.hierarquia || '').toLowerCase();
  if (h === 'inferior') return true;
  return h === 'redundante' && fu.parentId != null && fu.parentId !== '';
}

/**
 * Ticket ativo que absorveu outros (receptor / pai na hierarquia ou redundante como parent).
 * @param {Record<string, unknown>|null|undefined} item
 * @returns {boolean}
 */
export function isFusaoReceptor(item) {
  if (!item || typeof item !== 'object') return false;
  const fu = item.Fusao;
  if (!fu || fu.fundido !== true) return false;
  const h = String(fu.hierarquia || '').toLowerCase();
  if (h === 'superior') return true;
  return h === 'redundante' && (fu.parentId == null || fu.parentId === '') && fu.childId != null;
}

/**
 * @param {Record<string, unknown>} item — linha de reclamação
 * @returns {boolean}
 */
export function isUnreadFusaoAbsorvoAlvo(item) {
  if (!isFusaoAbsorvoAlvo(item)) return false;
  const rid = item?._id != null ? String(item._id) : '';
  if (!rid) return false;
  const eventMs = fusaoFundidoEventMs(item);
  if (eventMs <= 0) return false;
  return eventMs > getFusaoAbsAckMs(rid);
}

/**
 * @param {Array<Record<string, unknown>>|undefined} reclamacoes
 * @returns {number}
 */
export function countUnreadFusaoAbsAlvo(reclamacoes) {
  if (!Array.isArray(reclamacoes)) return 0;
  return reclamacoes.filter(isUnreadFusaoAbsorvoAlvo).length;
}

/** @returns {number} último valor ack conhecido (0 = nunca) */
export function getFusaoAbsAckMs(reclamacaoId) {
  const id = String(reclamacaoId || '').trim();
  if (!id) return 0;
  const m = loadMap();
  const v = m[id];
  return typeof v === 'number' && v > 0 ? v : 0;
}

/**
 * @param {string|undefined|null} reclamacaoId
 * @param {number} eventMs timestamp do evento fusão/fundido efetivo
 */
export function markFusaoAbsAckRead(reclamacaoId, eventMs) {
  const id = String(reclamacaoId || '').trim();
  const em = fusaoFundidoAckEventMs(eventMs);
  if (!id || em <= 0) return;
  const m = loadMap();
  m[id] = em;
  saveMap(m);
}

/**
 * @param {Record<string, unknown>} item
 */
export function markFusaoAbsAckReadFromItem(item) {
  const id = item?._id != null ? String(item._id) : '';
  const em = fusaoFundidoEventMs(item);
  markFusaoAbsAckRead(id, em);
}
