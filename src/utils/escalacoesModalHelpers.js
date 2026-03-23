/**
 * VeloHub V3 - Helpers compartilhados (modal Req_Prod / Erros-Bugs)
 * VERSION: v1.0.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 *
 * Usado por EscalacoesPage e ErrosBugsTab para status, diálogo reply, grid de payload e leitura msgProdutos.
 */

import React from 'react';

export const STORAGE_PROD_READ_SOLICITACOES = 'velohub_esc_prod_read_v1';
export const STORAGE_PROD_READ_ERROS_BUGS = 'velohub_esc_prod_read_erros_v1';

export const MODAL_PAYLOAD_SKIP_KEYS = new Set(['imagens', 'videos', 'previews', 'videoThumbnails']);

/**
 * Status do chamado a partir de reply[] (último item).
 */
export const getStatusChamado = (doc) => {
  const reply = Array.isArray(doc?.reply) ? doc.reply : [];
  if (reply.length === 0) return 'enviado';
  const last = reply[reply.length - 1];
  const s = String(last?.status || '').toLowerCase();
  if (s === 'cancelado') return 'Cancelado';
  if (['enviado', 'feito', 'não feito', 'nao feito'].includes(s)) return s === 'nao feito' ? 'não feito' : s;
  return 'enviado';
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
    console.error('[escalacoesModalHelpers] setProdutosReadMs:', e);
  }
};

export const hasUnreadProdutosInReplies = (solicitacaoId, replyArr, storageKey) => {
  const last = lastProdutosReplyAtMs(replyArr);
  if (last <= 0) return false;
  return last > getProdutosReadMs(solicitacaoId, storageKey);
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
