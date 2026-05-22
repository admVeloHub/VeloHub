/**
 * VeloHub V3 - Helpers compartilhados (modal Req_Prod / Erros-Bugs)
 * VERSION: v1.0.11 | DATE: 2026-05-15 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.11: Filtrar lista GET pela aba Requisições (Solicitações vs Liberação PIX) + partition abertas/resolvidas (modal antes de novo envio)
 * - v1.0.10: Rename ficheiro escalacoesModalHelpers → requisicoesModalHelpers; reconcileRequisicoesLocalLogs; logs `[requisicoesModalHelpers]` (chaves STORAGE inalteradas)
 * - v1.0.6: getStatusChamado: status efetivo pelo item de reply com maior `at` (cronológico), não só o último índice do array — corrige card não mostrar Cancelado quando a ordem do array não coincide com a ordem temporal
 * - v1.0.5: listUnreadProdutosDocs, produtosUnreadNotifySig, dedup de notificação (sessionStorage) para Req_Prod
 */

import React from 'react';

export const STORAGE_PROD_READ_SOLICITACOES = 'velohub_esc_prod_read_v1';
export const STORAGE_PROD_READ_ERROS_BUGS = 'velohub_esc_prod_read_erros_v1';

export const MODAL_PAYLOAD_SKIP_KEYS = new Set(['imagens', 'videos', 'previews', 'videoThumbnails']);

/**
 * Normaliza _id vindo da API (string hex, EJSON { $oid }, ou objeto com toHexString).
 * @param {unknown} id
 * @returns {string} hex 24 chars ou string vazia se inválido
 */
export const normalizeMongoId = (id) => {
  if (id == null || id === '') return '';
  if (typeof id === 'string') {
    const t = id.trim();
    if (/^[a-fA-F0-9]{24}$/.test(t)) return t.toLowerCase();
    return t;
  }
  if (typeof id === 'object') {
    if (typeof id.$oid === 'string') return normalizeMongoId(id.$oid);
    if (typeof id.toHexString === 'function') {
      try {
        return normalizeMongoId(id.toHexString());
      } catch {
        return '';
      }
    }
  }
  const s = String(id);
  if (s === '[object Object]') return '';
  return s;
};

/**
 * Encontra na lista do backend o documento correspondente a um item do log local.
 * Evita usar só cpf+tipo (sempre o mais recente) quando há vários envios iguais.
 * @param {Array<Object>} requests - lista GET /solicitacoes
 * @param {Object} item - { requestId?, cpf, tipo, createdAt? }
 * @returns {Object|null}
 */
export const findSolicitacaoForLocalLogItem = (requests, item) => {
  if (!Array.isArray(requests) || !item) return null;
  const rid = normalizeMongoId(item.requestId);
  const tipo = String(item.tipo || '');
  const isPixExclusao = tipo === 'Exclusão de Chave PIX';
  if (rid && /^[a-f0-9]{24}$/.test(rid)) {
    const byId = requests.find((r) => normalizeMongoId(r._id ?? r.id) === rid);
    return byId || null;
  }
  if (isPixExclusao) return null;
  const cpf = String(item.cpf || '').replace(/\D/g, '');
  const candidates = requests.filter(
    (r) => String(r.cpf || '').replace(/\D/g, '') === cpf && String(r.tipo || '') === tipo
  );
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const itemMs = new Date(item.createdAt).getTime();
  if (!Number.isFinite(itemMs)) return candidates[0];
  return candidates.reduce((best, r) => {
    if (!best) return r;
    const rm = new Date(r.createdAt).getTime();
    const bm = new Date(best.createdAt).getTime();
    const d = Number.isFinite(rm) ? Math.abs(rm - itemMs) : Number.POSITIVE_INFINITY;
    const bd = Number.isFinite(bm) ? Math.abs(bm - itemMs) : Number.POSITIVE_INFINITY;
    return d < bd ? r : best;
  }, null);
};

/**
 * Alinha o cache local (sidebar) com a lista atual do backend: remove órfãos (doc apagado no Mongo)
 * e atualiza status/requestId/reply quando há match.
 * @param {Array<Object>} localLogs
 * @param {Array<Object>} requests - resultado de GET /escalacoes/solicitacoes
 * @returns {Array<Object>}
 */
export const reconcileRequisicoesLocalLogs = (localLogs, requests) => {
  if (!Array.isArray(localLogs)) return [];
  if (!Array.isArray(requests)) return localLogs.slice();
  const idsInDb = new Set(
    requests
      .map((r) => normalizeMongoId(r._id ?? r.id))
      .filter((id) => /^[a-f0-9]{24}$/.test(id))
  );
  const out = [];
  const FRESH_MS = 5 * 60 * 1000;
  for (const item of localLogs) {
    const prevRid = normalizeMongoId(item.requestId);
    // Só tratar como órfão por id quando sabemos os ids do servidor; com lista vazia, Set vazio faria !has(id) para todos
    if (
      prevRid &&
      /^[a-f0-9]{24}$/.test(prevRid) &&
      idsInDb.size > 0 &&
      !idsInDb.has(prevRid)
    ) {
      const createdMs = new Date(item.createdAt || 0).getTime();
      const fresh = Number.isFinite(createdMs) && Date.now() - createdMs < FRESH_MS;
      if (fresh) {
        out.push({ ...item });
      }
      continue;
    }
    const match = findSolicitacaoForLocalLogItem(requests, item);
    if (!match) {
      continue;
    }
    const rid = normalizeMongoId(match._id ?? match.id);
    out.push({
      ...item,
      status: match.status,
      requestId: /^[a-f0-9]{24}$/.test(rid) ? rid : prevRid || undefined,
      reply: Array.isArray(match.reply) ? match.reply : item.reply,
    });
  }
  return out;
};

/**
 * Item de `reply[]` que define o status efetivo (maior `at` entre entradas com `status`).
 * @param {Object|null|undefined} doc
 * @returns {Object|null}
 */
export const pickReplyItemForEffectiveChamadoStatus = (doc) => {
  const reply = Array.isArray(doc?.reply) ? doc.reply : [];
  if (reply.length === 0) return null;

  const withStatus = reply
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => String(item?.status || '').trim() !== '');
  if (withStatus.length === 0) return null;

  withStatus.sort((a, b) => {
    const ta = parseReplyAtMs(a.item?.at);
    const tb = parseReplyAtMs(b.item?.at);
    const aAt = Number.isFinite(ta) && ta > 0 ? ta : 0;
    const bAt = Number.isFinite(tb) && tb > 0 ? tb : 0;
    if (aAt !== bAt) return aAt - bAt;
    return a.i - b.i;
  });

  return withStatus[withStatus.length - 1].item ?? null;
};

/**
 * Status do chamado a partir de reply[]: usa o item com maior `at` entre os que têm `status` preenchido
 * (evita depender da ordem do array no Mongo).
 */
export const getStatusChamado = (doc) => {
  const chosen = pickReplyItemForEffectiveChamadoStatus(doc);
  if (!chosen) return 'enviado';
  const s = String(chosen?.status || '').toLowerCase();
  if (s === 'cancelado') return 'Cancelado';
  if (['enviado', 'feito', 'não feito', 'nao feito'].includes(s)) return s === 'nao feito' ? 'não feito' : s;
  return 'enviado';
};

/**
 * Documento «Exclusão de Chave PIX» com origem no root ou em `payload` (GET /solicitacoes mesclado).
 * @param {Object|null|undefined} r
 * @returns {boolean}
 */
export const isDocLiberacaoChavePixAbaRequisicoes = (r) => {
  if (!r) return false;
  if (String(r.tipo || '').trim() !== 'Exclusão de Chave PIX') return false;
  const oTop = String(r.origem || '').trim();
  const pl = r.payload;
  const oPayload = pl && typeof pl === 'object' ? String(pl.origem || '').trim() : '';
  return Boolean(oTop || oPayload);
};

/**
 * Entrada da coleção `liberacao_pix_prod` no GET mesclado (marca `pixLiberado`).
 * @param {Object|null|undefined} r
 * @returns {boolean}
 */
export const isDocLiberacaoPixProdCollectionRequisicoes = (r) =>
  isDocLiberacaoChavePixAbaRequisicoes(r) && Object.prototype.hasOwnProperty.call(r, 'pixLiberado');

/**
 * Filtra o array de GET /escalacoes/solicitacoes conforme a aba (paridade com RequisicoesPage).
 * @param {Array<Object>} docs
 * @param {boolean} liberacaoChavePixTab
 * @returns {Array<Object>}
 */
export const filterSolicitacoesGetListByRequisicoesTab = (docs, liberacaoChavePixTab) => {
  const list = Array.isArray(docs) ? docs : [];
  if (liberacaoChavePixTab) return list.filter(isDocLiberacaoPixProdCollectionRequisicoes);
  return list.filter((r) => !isDocLiberacaoChavePixAbaRequisicoes(r));
};

/**
 * Rótulo de origem para exibição (Liberação PIX).
 * @param {Object} doc
 * @returns {string}
 */
export const getOrigemExibicaoRequisicaoDoc = (doc) => {
  const top = String(doc?.origem || '').trim();
  const pl = doc?.payload;
  const sub = pl && typeof pl === 'object' ? String(pl.origem || '').trim() : '';
  return top || sub || '';
};

/**
 * Particiona documentos do CPF em «abertas» (status enviado) e «resolvidas» (feito / não feito / Cancelado).
 * Ordenação: `createdAt` mais recente primeiro.
 * @param {Array<Object>} docs
 * @returns {{ abertas: Array<Object>, resolvidas: Array<Object> }}
 */
export const partitionRequisicoesAbertasResolvidasParaModal = (docs) => {
  const list = Array.isArray(docs) ? [...docs] : [];
  list.sort((a, b) => {
    const tb = new Date(b?.createdAt).getTime();
    const ta = new Date(a?.createdAt).getTime();
    if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
    return 0;
  });
  const abertas = [];
  const resolvidas = [];
  for (const doc of list) {
    const st = getStatusChamado(doc);
    const row = {
      key: normalizeMongoId(doc?._id ?? doc?.id) || `${String(doc?.tipo)}-${String(doc?.createdAt)}`,
      tipo: String(doc?.tipo || '').trim() || '—',
      origemLabel: getOrigemExibicaoRequisicaoDoc(doc),
      createdAt: doc?.createdAt,
      statusChamado: st,
    };
    if (st === 'enviado') abertas.push(row);
    else resolvidas.push(row);
  }
  return { abertas, resolvidas };
};

/**
 * Data/hora em que o status atual do chamado foi atribuído (campo `at` do reply efetivo), ou null.
 * @param {Object|null|undefined} doc
 * @returns {Date|null}
 */
export const getStatusChamadoAssignedAt = (doc) => {
  const chosen = pickReplyItemForEffectiveChamadoStatus(doc);
  if (!chosen || chosen.at == null || chosen.at === '') return null;
  const d = new Date(chosen.at);
  return Number.isFinite(d.getTime()) ? d : null;
};

/**
 * Status finais nos quais exibimos a data ao lado da badge no cabeçalho do modal (rótulos normalizados de getStatusChamado).
 * @param {unknown} statusLabel
 * @returns {boolean}
 */
export const isTerminalChamadoStatusForHeader = (statusLabel) => {
  const s = String(statusLabel || '').toLowerCase();
  return s === 'feito' || s === 'não feito' || s === 'nao feito' || s === 'cancelado';
};

export const parseReplyAtMs = (at) => {
  if (at == null || at === '') return 0;
  const t = new Date(at).getTime();
  return Number.isFinite(t) ? t : 0;
};

export const lastProdutosReplyAtMs = (replyArr) => {
  if (!Array.isArray(replyArr)) return 0;
  let max = 0;
  for (const r of replyArr) {
    const mp = r?.msgProdutos;
    if (mp != null && String(mp).trim() !== '') {
      const ts = parseReplyAtMs(r.at);
      if (ts > max) max = ts;
    }
  }
  return max;
};

export const getProdutosReadMs = (solicitacaoId, storageKey) => {
  if (solicitacaoId == null || solicitacaoId === '') return 0;
  try {
    const raw = localStorage.getItem(storageKey);
    const map = raw ? JSON.parse(raw) : {};
    const v = map[String(solicitacaoId)];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    return parseReplyAtMs(v);
  } catch {
    return 0;
  }
};

export const setProdutosReadMs = (solicitacaoId, tsMs, storageKey) => {
  if (solicitacaoId == null || solicitacaoId === '' || !Number.isFinite(tsMs) || tsMs <= 0) return;
  try {
    const raw = localStorage.getItem(storageKey);
    const map = raw ? JSON.parse(raw) : {};
    map[String(solicitacaoId)] = tsMs;
    localStorage.setItem(storageKey, JSON.stringify(map));
  } catch (e) {
    console.error('[requisicoesModalHelpers] setProdutosReadMs:', e);
  }
};

export const hasUnreadProdutosInReplies = (solicitacaoId, replyArr, storageKey) => {
  const last = lastProdutosReplyAtMs(replyArr);
  if (last <= 0) return false;
  return last > getProdutosReadMs(solicitacaoId, storageKey);
};

/** Chave sessionStorage para não repetir Notification do mesmo msg Produtos */
export const PROD_NOTIFY_DEDUP_SESSION_KEY = 'velohub_prod_notify_dedup_v1';

/**
 * Lista documentos com mensagem do time Produtos não lida (sidebar / badge Req_Prod).
 * @param {Array<Object>} docs
 * @param {string} storageKey
 * @returns {Array<{ id: string, tipo: string, cpf: string, preview: string, lastAt: number }>}
 */
export const listUnreadProdutosDocs = (docs, storageKey) => {
  const out = [];
  for (const r of docs || []) {
    const id = normalizeMongoId(r._id ?? r.id);
    if (!id) continue;
    const reply = Array.isArray(r.reply) ? r.reply : [];
    if (!hasUnreadProdutosInReplies(id, reply, storageKey)) continue;
    const lastAt = lastProdutosReplyAtMs(reply);
    let preview = '';
    for (let i = reply.length - 1; i >= 0; i--) {
      const mp = reply[i]?.msgProdutos;
      if (mp != null && String(mp).trim() !== '') {
        preview = String(mp).trim().slice(0, 140);
        break;
      }
    }
    out.push({
      id,
      tipo: String(r.tipo || '—'),
      cpf: String(r.cpf || '—'),
      preview,
      lastAt,
    });
  }
  return out;
};

/**
 * Assinatura estável para deduplicar notificações (sol | erros).
 * @param {'sol'|'erros'} source
 * @param {string} id
 * @param {number} lastAt
 */
export const produtosUnreadNotifySig = (source, id, lastAt) =>
  `${source}:${id}:${lastAt}`;

export const hasProdutosNotificationBeenSent = (sig) => {
  try {
    const raw = sessionStorage.getItem(PROD_NOTIFY_DEDUP_SESSION_KEY);
    const set = new Set(raw ? JSON.parse(raw) : []);
    return set.has(sig);
  } catch {
    return false;
  }
};

export const markProdutosNotificationSent = (sig) => {
  try {
    const raw = sessionStorage.getItem(PROD_NOTIFY_DEDUP_SESSION_KEY);
    const set = new Set(raw ? JSON.parse(raw) : []);
    set.add(sig);
    sessionStorage.setItem(PROD_NOTIFY_DEDUP_SESSION_KEY, JSON.stringify([...set].slice(-100)));
  } catch {
    /* ignore */
  }
};

export const buildProdutosN1Dialogue = (replyArr) => {
  if (!Array.isArray(replyArr)) return [];
  const out = [];
  replyArr.forEach((item, i) => {
    const at = item?.at ? new Date(item.at).toLocaleString('pt-BR') : '';
    const mp = item?.msgProdutos != null && String(item.msgProdutos).trim() !== '';
    const mn = item?.msgN1 != null && String(item.msgN1).trim() !== '';
    if (mp) {
      out.push({
        key: `prod-${i}`,
        role: 'produtos',
        text: String(item.msgProdutos).trim(),
        at,
      });
    }
    if (mn) {
      out.push({
        key: `n1-${i}`,
        role: 'n1',
        text: String(item.msgN1).trim(),
        at,
      });
    }
    if (!mp && !mn) {
      const st = String(item?.status || '').toLowerCase();
      if (st === 'cancelado') {
        out.push({
          key: `sys-${i}`,
          role: 'system',
          text: 'Registro cancelado',
          at,
        });
      }
    }
  });
  return out;
};

export const statusChamadoBadgeClass = (statusLabel) => {
  const s = String(statusLabel || '').toLowerCase();
  if (s === 'feito') {
    return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700';
  }
  if (s === 'não feito' || s === 'nao feito') {
    return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700';
  }
  if (s === 'cancelado') {
    return 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600';
  }
  return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700';
};

export const modalPayloadFieldLabel = (key) => {
  const raw = String(key).replace(/_/g, ' ');
  const parts = raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return key;
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const isRelevantPayloadValue = (v) => {
  if (v === undefined || v === null) return false;
  if (typeof v === 'boolean') return v === true;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
};

export const formatModalPayloadValue = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return 'Sim';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    if (typeof v[0] === 'object' && v[0] !== null) return `${v.length} item(ns)`;
    return v.map((x) => String(x)).join(', ');
  }
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return '—';
    }
  }
  const s = String(v).trim();
  return s || '—';
};

export const buildModalExtraPayloadCells = (doc) => {
  const payload = doc?.payload && typeof doc.payload === 'object' ? doc.payload : {};
  const cells = [];
  const agente =
    (doc?.colaboradorNome != null && String(doc.colaboradorNome).trim() !== '')
      ? String(doc.colaboradorNome).trim()
      : (doc?.agente != null && String(doc.agente).trim() !== '')
        ? String(doc.agente).trim()
        : (payload.agente != null && String(payload.agente).trim() !== '')
          ? String(payload.agente).trim()
          : '';
  if (agente) {
    cells.push({ key: 'agente', label: 'Agente', value: agente });
  }

  const keys = Object.keys(payload)
    .filter((k) => !MODAL_PAYLOAD_SKIP_KEYS.has(k))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  for (const k of keys) {
    if (k === 'cpf' || k === 'tipo' || k === 'agente') continue;
    const v = payload[k];
    if (!isRelevantPayloadValue(v)) continue;
    cells.push({ key: k, label: modalPayloadFieldLabel(k), value: formatModalPayloadValue(v) });
  }
  return cells;
};

export const ModalInfoGridCell = ({ label, value }) => (
  <div className="min-w-0">
    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</div>
    <div className="text-sm text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">{value}</div>
  </div>
);
