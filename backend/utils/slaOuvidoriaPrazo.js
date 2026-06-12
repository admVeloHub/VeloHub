/**
 * VeloHub V3 — SLA automático Ouvidoria (prazos por tipo de reclamação)
 * VERSION: v1.3.0 | DATE: 2026-06-12 | AUTHOR: VeloHub Development Team
 *
 * - BACEN: 10 dias úteis (seg–sex, calendário America/Sao_Paulo) após dataEntrada
 * - N2/Ouvidoria: 2 dias corridos UTC após createdAt
 * - Procon / Consumidor.gov: 10 dias corridos UTC após dataProcon (campo prazoProcon)
 * - Reclame Aqui: 3 dias úteis (SP) após createdAt (campo prazoReclameAqui)
 */

'use strict';

const SP_TZ = 'America/Sao_Paulo';

const SLA_DIAS_UTEIS_BACEN = 10;
const SLA_DIAS_CORRIDOS_N2_OUVIDORIA = 2;
const SLA_DIAS_CORRIDOS_PROCON = 10;
const SLA_DIAS_UTEIS_RECLAME_AQUI = 3;

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
 * Data limite = N dias corridos (UTC) após createdAt.
 * @param {Date|string|null|undefined} createdAt
 * @param {number} diasCorridos
 * @returns {Date}
 */
function prazoAutomaticoDiasCorridosUtcAposCriacao(createdAt, diasCorridos) {
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
 * Data limite = N dias úteis (seg–sex) após o dia civil da data de referência em America/Sao_Paulo.
 * O dia de referência não entra na contagem.
 * @param {Date|string|null|undefined} dataReferencia
 * @param {number} diasUteis
 * @returns {Date}
 */
function prazoAutomaticoDiasUteisSpAposCriacao(dataReferencia, diasUteis) {
  const n = Number(diasUteis);
  const alvo = Number.isFinite(n) && n > 0 ? n : SLA_DIAS_UTEIS_BACEN;
  const base =
    dataReferencia instanceof Date
      ? dataReferencia
      : dataReferencia
        ? new Date(dataReferencia)
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

/** @param {unknown} value @returns {Date|null} */
function parseRefDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Data de referência do SLA conforme coleção (LISTA_SCHEMAS: BACEN → dataEntrada; Procon → dataProcon).
 * @param {string} collectionName
 * @param {Record<string, unknown>|null|undefined} alvo
 * @param {Record<string, unknown>|null|undefined} existente
 * @returns {Date|null}
 */
function resolverDataReferenciaSlaPorColecao(collectionName, alvo, existente) {
  const src = alvo && typeof alvo === 'object' ? alvo : {};
  const prev = existente && typeof existente === 'object' ? existente : {};

  if (collectionName === 'reclamacoes_bacen') {
    return parseRefDate(src.dataEntrada ?? prev.dataEntrada);
  }
  if (collectionName === 'reclamacoes_procon') {
    return parseRefDate(src.dataProcon ?? prev.dataProcon);
  }
  return parseRefDate(src.createdAt ?? prev.createdAt);
}

/**
 * @param {string} collectionName
 * @param {Date|string|null|undefined} dataReferencia
 * @returns {Date|null}
 */
function calcularPrazoSlaPorColecao(collectionName, dataReferencia) {
  if (!dataReferencia) return null;
  if (collectionName === 'reclamacoes_bacen') {
    return prazoAutomaticoDiasUteisSpAposCriacao(dataReferencia, SLA_DIAS_UTEIS_BACEN);
  }
  if (collectionName === 'reclamacoes_n2Pix') {
    return prazoAutomaticoDiasCorridosUtcAposCriacao(dataReferencia, SLA_DIAS_CORRIDOS_N2_OUVIDORIA);
  }
  if (collectionName === 'reclamacoes_procon') {
    return prazoAutomaticoDiasCorridosUtcAposCriacao(dataReferencia, SLA_DIAS_CORRIDOS_PROCON);
  }
  if (collectionName === 'reclamacoes_reclameAqui') {
    return prazoAutomaticoDiasUteisSpAposCriacao(dataReferencia, SLA_DIAS_UTEIS_RECLAME_AQUI);
  }
  return null;
}

/**
 * Aplica prazo automático no documento conforme a coleção; remove campos de outras famílias.
 * @param {Record<string, unknown>} alvo
 * @param {string} collectionName
 * @param {Record<string, unknown>|null|undefined} [existente]
 */
function aplicarPrazoAutomaticoPorColecao(alvo, collectionName, existente) {
  if (!alvo || typeof alvo !== 'object') return;
  delete alvo.prazoBacen;
  delete alvo.prazoOuvidoria;
  delete alvo.prazoProcon;
  delete alvo.prazoReclameAqui;

  const dataRef = resolverDataReferenciaSlaPorColecao(collectionName, alvo, existente);
  const prazo = calcularPrazoSlaPorColecao(collectionName, dataRef);
  if (!prazo) return;

  if (collectionName === 'reclamacoes_bacen') alvo.prazoBacen = prazo;
  else if (collectionName === 'reclamacoes_n2Pix') alvo.prazoOuvidoria = prazo;
  else if (collectionName === 'reclamacoes_procon') alvo.prazoProcon = prazo;
  else if (collectionName === 'reclamacoes_reclameAqui') alvo.prazoReclameAqui = prazo;
}

module.exports = {
  SP_TZ,
  SLA_DIAS_UTEIS_BACEN,
  SLA_DIAS_CORRIDOS_N2_OUVIDORIA,
  SLA_DIAS_CORRIDOS_PROCON,
  SLA_DIAS_UTEIS_RECLAME_AQUI,
  prazoAutomaticoDiasCorridosUtcAposCriacao,
  prazoAutomaticoDiasUteisSpAposCriacao,
  resolverDataReferenciaSlaPorColecao,
  calcularPrazoSlaPorColecao,
  aplicarPrazoAutomaticoPorColecao,
};
