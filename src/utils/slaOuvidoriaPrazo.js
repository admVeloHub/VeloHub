/**
 * VeloHub V3 — SLA automático Ouvidoria (prazos por tipo de reclamação)
 * VERSION: v1.1.0 | DATE: 2026-06-10 | AUTHOR: VeloHub Development Team
 *
 * Espelho do backend/utils/slaOuvidoriaPrazo.js para prévia em formulários.
 * - v1.1.0: Reclame Aqui — 3 dias úteis (prazoReclameAqui)
 */

const SP_TZ = 'America/Sao_Paulo';

export const SLA_DIAS_UTEIS_BACEN = 10;
export const SLA_DIAS_CORRIDOS_N2_OUVIDORIA = 2;
export const SLA_DIAS_CORRIDOS_PROCON = 10;
export const SLA_DIAS_UTEIS_RECLAME_AQUI = 3;

/** @param {Date} instant */
function spYmdFromInstant(instant) {
  const iso = instant.toLocaleString('en-CA', {
    timeZone: SP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** @param {{ y: number, m: number, d: number }} ymd @param {number} delta */
function addCalendarDaysYmd(ymd, delta) {
  const d = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  d.setUTCDate(d.getUTCDate() + delta);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

/** @param {{ y: number, m: number, d: number }} ymd */
function isWeekdayYmd(ymd) {
  const dow = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
  return dow >= 1 && dow <= 5;
}

/** @param {{ y: number, m: number, d: number }} ymd @returns {Date} */
function ymdToUtcNoonDate(ymd) {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12, 0, 0));
}

/**
 * @param {Date|string|null|undefined} createdAt
 * @param {number} diasCorridos
 * @returns {Date}
 */
export function prazoAutomaticoDiasCorridosUtcAposCriacao(createdAt, diasCorridos) {
  const n = Number(diasCorridos);
  const dias = Number.isFinite(n) && n > 0 ? n : 2;
  const base =
    createdAt instanceof Date
      ? createdAt
      : createdAt
        ? new Date(createdAt)
        : new Date();
  if (Number.isNaN(base.getTime())) return new Date();
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}

/**
 * @param {Date|string|null|undefined} createdAt
 * @param {number} diasUteis
 * @returns {Date}
 */
export function prazoAutomaticoDiasUteisSpAposCriacao(createdAt, diasUteis) {
  const n = Number(diasUteis);
  const alvo = Number.isFinite(n) && n > 0 ? n : SLA_DIAS_UTEIS_BACEN;
  const base =
    createdAt instanceof Date
      ? createdAt
      : createdAt
        ? new Date(createdAt)
        : new Date();
  if (Number.isNaN(base.getTime())) return new Date();

  let ymd = spYmdFromInstant(base);
  let contados = 0;
  while (contados < alvo) {
    ymd = addCalendarDaysYmd(ymd, 1);
    if (isWeekdayYmd(ymd)) contados += 1;
  }
  return ymdToUtcNoonDate(ymd);
}

/**
 * @param {string} tipoNorm — BACEN | OUVIDORIA | PROCON
 * @param {Date|string|null|undefined} createdAt
 * @returns {Date|null}
 */
export function calcularPrazoSlaPorTipoNorm(tipoNorm, createdAt) {
  const t = String(tipoNorm || '').toUpperCase();
  if (t === 'BACEN') return prazoAutomaticoDiasUteisSpAposCriacao(createdAt, SLA_DIAS_UTEIS_BACEN);
  if (t === 'OUVIDORIA' || t === 'N2 PIX' || t === 'N2') {
    return prazoAutomaticoDiasCorridosUtcAposCriacao(createdAt, SLA_DIAS_CORRIDOS_N2_OUVIDORIA);
  }
  if (t === 'PROCON') {
    return prazoAutomaticoDiasCorridosUtcAposCriacao(createdAt, SLA_DIAS_CORRIDOS_PROCON);
  }
  if (t === 'RECLAME_AQUI' || t === 'RECLAME AQUI') {
    return prazoAutomaticoDiasUteisSpAposCriacao(createdAt, SLA_DIAS_UTEIS_RECLAME_AQUI);
  }
  return null;
}

/**
 * YYYY-MM-DD do prazo salvo ou derivado de createdAt (prévia em edição).
 * @param {string} tipoNorm
 * @param {Record<string, unknown>|null|undefined} rec
 * @returns {string}
 */
export function dataPrazoAutomaticoYmdParaExibicao(tipoNorm, rec) {
  if (!rec) return '';
  const t = String(tipoNorm || '').toUpperCase();
  let salvo = null;
  if (t === 'BACEN') salvo = rec.prazoBacen;
  else if (t === 'OUVIDORIA' || t === 'N2 PIX' || t === 'N2') salvo = rec.prazoOuvidoria;
  else if (t === 'PROCON') salvo = rec.prazoProcon;
  else if (t === 'RECLAME_AQUI' || t === 'RECLAME AQUI') salvo = rec.prazoReclameAqui;

  if (salvo) {
    try {
      const d = new Date(salvo);
      if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {
      /* ignore */
    }
  }
  if (!rec.createdAt) return '';
  const prazo = calcularPrazoSlaPorTipoNorm(t, rec.createdAt);
  if (!prazo || Number.isNaN(prazo.getTime())) return '';
  return prazo.toISOString().split('T')[0];
}
