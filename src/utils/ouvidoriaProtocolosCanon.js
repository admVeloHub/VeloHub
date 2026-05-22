/**
 * VeloHub V3 - Protocolos canônicos hub_ouvidoria (espelho front)
 * VERSION: v1.0.0 | DATE: 2026-05-21 | AUTHOR: VeloHub Development Team
 *
 * Leitura com fallbacks nativos — mesmas regras de backend/utils/ouvidoriaProtocolosCanon.js
 */

import { tipoToTierKey } from './ouvidoriaTierHierarchy';

/** @typedef {'CENTRAL'|'N2'|'RECLAME_AQUI'|'PROCON'|'BACEN'} CanalProtocolo */

/**
 * @param {unknown} arr
 * @returns {string[]}
 */
export function normalizeProtocolArray(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((p) => String(p != null ? p : '').trim()).filter(Boolean))];
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function trimStr(value) {
  return value != null ? String(value).trim() : '';
}

/**
 * @param {string} tipo
 * @returns {string|null}
 */
export function normalizeTipoOuvidoria(tipo) {
  return tipoToTierKey(tipo);
}

/**
 * @param {Record<string, unknown>|null|undefined} doc
 * @param {CanalProtocolo} canal
 * @returns {string[]}
 */
export function extractProtocolosFromDoc(doc, canal) {
  if (!doc || typeof doc !== 'object') return [];

  const tier = normalizeTipoOuvidoria(doc.tipo);

  switch (canal) {
    case 'CENTRAL': {
      const fromArray = normalizeProtocolArray(doc.protocolosCentral);
      if (fromArray.length > 0) return fromArray;
      if (tier === 'TIME_PORTABILIDADE') {
        const oct = trimStr(doc.protocoloOctadesk);
        if (oct) return [oct];
        const reg = trimStr(doc.ticketRegistro);
        if (reg) return [reg];
      }
      return [];
    }
    case 'N2': {
      const fromArray = normalizeProtocolArray(doc.protocolosN2);
      if (fromArray.length > 0) return fromArray;
      if (tier === 'N2_PIX') {
        const np = trimStr(doc.numeroProtocolo);
        if (np) return [np];
      }
      return [];
    }
    case 'RECLAME_AQUI': {
      const fromArray = normalizeProtocolArray(doc.protocolosReclameAqui);
      if (fromArray.length > 0) return fromArray;
      const idEntrada = trimStr(doc.idEntrada);
      if (idEntrada) return [idEntrada];
      return [];
    }
    case 'PROCON': {
      const fromArray = normalizeProtocolArray(doc.protocolosProcon);
      if (fromArray.length > 0) return fromArray;
      const codigo = trimStr(doc.codigoProcon);
      if (codigo) return [codigo];
      return [];
    }
    case 'BACEN': {
      const fromArray = normalizeProtocolArray(doc.protocolosBacen);
      if (fromArray.length > 0) return fromArray;
      if (tier === 'BACEN') {
        const np = trimStr(doc.numeroProtocolo);
        if (np) return [np];
      }
      return [];
    }
    default:
      return [];
  }
}

/**
 * Agrega protocolos de registros retornados por CPF (Localizar Atendimentos).
 * @param {Array<Record<string, unknown>>} registros
 * @param {object} options
 * @returns {object}
 */
export function aggregateProtocolosFromRegistros(registros, options) {
  const {
    tipoExcluir,
    tipoFormulario,
    pixLiberado: pixInicial = false,
    statusContratoQuitado: quitadoInicial = false,
    contratoCancelado: canceladoInicial = false,
  } = options;

  const protocolosCentral = [];
  const protocolosN2 = [];
  const protocolosReclameAqui = [];
  const protocolosProcon = [];
  const protocolosOctadeskPort = [];

  let acionouCentral = false;
  let n2SegundoNivel = false;
  let reclameAqui = false;
  let procon = false;
  let pixLiberado = pixInicial;
  let statusContratoQuitado = quitadoInicial;
  let contratoCancelado = canceladoInicial === true;

  const incluirN2 = tipoExcluir !== 'OUVIDORIA';
  const incluirReclameAqui = tipoExcluir !== 'RECLAME_AQUI';
  const incluirProcon = true;
  const incluirN2SegundoNivel = tipoExcluir !== 'OUVIDORIA';

  for (const r of registros) {
    const tipo = String(r.tipo || '').toUpperCase().trim();
    const tier = normalizeTipoOuvidoria(r.tipo);
    const isTimePort =
      tier === 'TIME_PORTABILIDADE' ||
      tipo === 'TIME PORTABILIDADE' ||
      tipo === 'TIME_PORTABILIDADE' ||
      (tipo.includes('TIME') && tipo.includes('PORT'));

    if (isTimePort) {
      const octList = extractProtocolosFromDoc(r, 'CENTRAL');
      if (octList.length > 0) protocolosOctadeskPort.push(...octList);
    }

    const centralFromDoc = extractProtocolosFromDoc(r, 'CENTRAL');
    if (centralFromDoc.length > 0 || r.acionouCentral === true) {
      if (centralFromDoc.length > 0) {
        acionouCentral = true;
        protocolosCentral.push(...centralFromDoc);
      } else if (r.acionouCentral === true && Array.isArray(r.protocolosCentral)) {
        acionouCentral = true;
        protocolosCentral.push(...normalizeProtocolArray(r.protocolosCentral));
      }
    }

    if (incluirN2 && tier === 'N2_PIX') {
      const n2List = extractProtocolosFromDoc(r, 'N2');
      if (n2List.length > 0 || r.n2SegundoNivel === true) {
        if (incluirN2SegundoNivel) n2SegundoNivel = true;
        if (n2List.length > 0) protocolosN2.push(...n2List);
        else if (Array.isArray(r.protocolosN2)) {
          protocolosN2.push(...normalizeProtocolArray(r.protocolosN2));
        }
      }
    }

    if (incluirReclameAqui && tier === 'RECLAME_AQUI') {
      const raList = extractProtocolosFromDoc(r, 'RECLAME_AQUI');
      if (raList.length > 0) {
        reclameAqui = true;
        protocolosReclameAqui.push(...raList);
      }
    }

    if (incluirProcon && tier === 'PROCON') {
      const pcList = extractProtocolosFromDoc(r, 'PROCON');
      if (pcList.length > 0) {
        procon = true;
        protocolosProcon.push(...pcList);
      }
    }

    if (tier === 'BACEN') {
      if (r.pixLiberado === true) pixLiberado = true;
      if (r.statusContratoQuitado === true) statusContratoQuitado = true;
    }
    if (r.contratoCancelado === true) contratoCancelado = true;
  }

  const octUniq = [...new Set(protocolosOctadeskPort)];
  const tpForm = normalizeTipoOuvidoria(tipoFormulario) === 'TIME_PORTABILIDADE';
  let protocoloOctadeskForTp = '';

  if (octUniq.length > 0) {
    if (tpForm) {
      protocoloOctadeskForTp = octUniq[0];
    } else {
      acionouCentral = true;
      protocolosCentral.push(...octUniq);
    }
  }

  return {
    protocolosCentral: [...new Set(protocolosCentral)],
    protocolosN2: [...new Set(protocolosN2)],
    protocolosReclameAqui: [...new Set(protocolosReclameAqui)],
    protocolosProcon: [...new Set(protocolosProcon)],
    protocolosOctadeskPort: octUniq,
    protocoloOctadeskForTp,
    acionouCentral,
    n2SegundoNivel,
    reclameAqui,
    procon,
    pixLiberado,
    statusContratoQuitado,
    contratoCancelado,
    incluirN2,
    incluirN2SegundoNivel,
  };
}
