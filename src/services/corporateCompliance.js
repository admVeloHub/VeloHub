/**
 * VeloHub V3 — Prefetch e snooze do modal de compliance corporativo
 * VERSION: v1.4.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.4.0: ensureComplianceModalOnLogin — modal sempre no login se houver pendências
 * - v1.3.0: normalizeCompliancePending — título do acordeão no modal da Home
 */

import { corporateAPI } from './api';
import { resolvePoliticasAccordionLabel } from '../config/politicasNormasAccordions';

/**
 * Normaliza labels de pending (título do acordeão em Políticas e Normas).
 * @param {object[]} pending
 * @returns {object[]}
 */
export function normalizeCompliancePending(pending) {
  if (!Array.isArray(pending)) return [];
  return pending.map((item) => {
    const accordionLabel = resolvePoliticasAccordionLabel(item);
    return accordionLabel ? { ...item, label: accordionLabel } : item;
  });
}

const COMPLIANCE_MODAL_SNOOZE_MS = 10 * 60 * 1000;
const COMPLIANCE_MODAL_SNOOZE_PREFIX = 'velohub_compliance_modal_snooze_';
const COMPLIANCE_READ_LATER_USED_PREFIX = 'velohub_compliance_read_later_used_';

function snoozeStorageKey(userEmail) {
  return `${COMPLIANCE_MODAL_SNOOZE_PREFIX}${String(userEmail || '').trim().toLowerCase()}`;
}

function readLaterUsedStorageKey(userEmail) {
  return `${COMPLIANCE_READ_LATER_USED_PREFIX}${String(userEmail || '').trim().toLowerCase()}`;
}

function notifyComplianceSnoozeChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('velohub:compliance-snooze-changed'));
  }
}

/**
 * @param {string} userEmail
 * @returns {Promise<object[]>}
 */
export async function prefetchCompliancePending(userEmail) {
  const email = String(userEmail || '').trim().toLowerCase();
  if (!email) return [];
  try {
    const res = await corporateAPI.getCompliancePending(email);
    return normalizeCompliancePending(res?.pending || []);
  } catch (error) {
    console.error('prefetchCompliancePending:', error);
    return [];
  }
}

/**
 * @param {string} userEmail
 * @returns {number}
 */
export function getComplianceModalSnoozeUntil(userEmail) {
  try {
    const raw = localStorage.getItem(snoozeStorageKey(userEmail));
    const until = raw ? Number(raw) : 0;
    return Number.isFinite(until) ? until : 0;
  } catch {
    return 0;
  }
}

/**
 * @param {string} userEmail
 */
export function isComplianceModalSnoozed(userEmail) {
  return getComplianceModalSnoozeUntil(userEmail) > Date.now();
}

/**
 * @param {string} userEmail
 */
export function isComplianceReadLaterUsed(userEmail) {
  try {
    return localStorage.getItem(readLaterUsedStorageKey(userEmail)) === '1';
  } catch {
    return false;
  }
}

/**
 * @param {string} userEmail
 */
export function markComplianceReadLaterUsed(userEmail) {
  try {
    localStorage.setItem(readLaterUsedStorageKey(userEmail), '1');
  } catch {
    /* ignore */
  }
  notifyComplianceSnoozeChanged();
}

/**
 * @param {string} userEmail
 */
export function clearComplianceReadLaterUsed(userEmail) {
  try {
    localStorage.removeItem(readLaterUsedStorageKey(userEmail));
  } catch {
    /* ignore */
  }
  notifyComplianceSnoozeChanged();
}

/**
 * Limpa snooze e flag de «Ler depois» quando não há mais pendências.
 * @param {string} userEmail
 */
export function resetComplianceModalCycle(userEmail) {
  clearComplianceModalSnooze(userEmail);
  clearComplianceReadLaterUsed(userEmail);
}

/**
 * No login: zera snooze/«Ler depois» para exibir o modal se ainda houver ciências pendentes.
 * @param {string} userEmail
 * @param {object[]} pending
 * @returns {object[]}
 */
export function ensureComplianceModalOnLogin(userEmail, pending) {
  const normalized = normalizeCompliancePending(pending);
  const email = String(userEmail || '').trim().toLowerCase();
  if (email && normalized.length > 0) {
    resetComplianceModalCycle(email);
  }
  return normalized;
}

/**
 * @param {string} userEmail
 * @returns {number} timestamp até quando o modal fica oculto
 */
export function snoozeComplianceModal(userEmail) {
  if (isComplianceReadLaterUsed(userEmail)) {
    return getComplianceModalSnoozeUntil(userEmail);
  }

  markComplianceReadLaterUsed(userEmail);

  const until = Date.now() + COMPLIANCE_MODAL_SNOOZE_MS;
  try {
    localStorage.setItem(snoozeStorageKey(userEmail), String(until));
  } catch {
    /* ignore */
  }
  notifyComplianceSnoozeChanged();
  return until;
}

export function clearComplianceModalSnooze(userEmail) {
  try {
    localStorage.removeItem(snoozeStorageKey(userEmail));
  } catch {
    /* ignore */
  }
  notifyComplianceSnoozeChanged();
}

/**
 * @param {string} userEmail
 * @param {object[]} compliancePending
 */
export function isComplianceNavigationBlocked(userEmail, compliancePending) {
  if (!Array.isArray(compliancePending) || compliancePending.length === 0) return false;
  return !isComplianceModalSnoozed(userEmail);
}
