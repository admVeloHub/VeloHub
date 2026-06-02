/**
 * Formata valores de data como YYYY-MM-DD no calendário America/Sao_Paulo.
 * VERSION: v1.1.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 * - v1.1.0: formatarDataHoraSp (data+hora pt-BR em America/Sao_Paulo)
 *
 * - Strings «YYYY-MM-DD» são devolvidas sem reinterpretar (evita off-by-one UTC).
 * - Instantes Date / ISO com hora usam timeZone America/Sao_Paulo (independente do SO).
 */

'use strict';

const SP_TZ = 'America/Sao_Paulo';
const RE_ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** @param {unknown} v @returns {string} */
function formatarDataCalendarioSp(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (RE_ISO_DATE_ONLY.test(trimmed)) return trimmed;
  }
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-CA', {
    timeZone: SP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** @param {unknown} v @returns {string} */
function formatarDataHoraSp(v) {
  if (v == null || v === '') return '';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('pt-BR', {
    timeZone: SP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

module.exports = {
  SP_TZ,
  formatarDataCalendarioSp,
  formatarDataHoraSp,
};
