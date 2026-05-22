/**
 * VeloHub — Mensagem «Retorno da busca» após localizarAtendimentos (CPF)
 * VERSION: v1.0.2 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Situações (texto exibido):
 * - Sem ocorrências no CPF → Nenhuma ocorrência encontrada
 * - Só a ocorrência atual (edição) / nenhum outro documento → Nenhuma ocorrência encontrada
 * - Mesmo tipo + id diferente + em aberto → Encontrada redundância de registro.
 * - Mesmo tipo + id diferente + resolvido ou absorvido por fusão → Encontrada ocorrência. Caso anterior encerrado.
 * - Apenas outros tipos → Ocorrência encontrada em [tipos]
 */

import { isFusaoAbsorvoAlvo } from './ouvidoriaFusaoNotif';

/** @param {unknown} tipo */
export function normalizeTipoOcorrenciaComparacao(tipo) {
  const t = String(tipo || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (t === 'N2' || t === 'N2 PIX' || t === 'OUVIDORIA') return 'OUVIDORIA';
  if (t === 'RECLAME AQUI' || t === 'RECLAME_AQUI') return 'RECLAME_AQUI';
  if (
    t === 'TIME PORTABILIDADE' ||
    t === 'TIME_PORTABILIDADE' ||
    (t.includes('TIME') && t.includes('PORT'))
  ) {
    return 'TIME_PORTABILIDADE';
  }
  if (
    t === 'PROCESSOS' ||
    t === 'JUDICIAL' ||
    t === 'AÇÃO JUDICIAL' ||
    t === 'ACAO JUDICIAL'
  ) {
    return 'PROCESSOS';
  }
  return t;
}

function isResolvidoOuFundido(r) {
  if (r?.Finalizado?.Resolvido === true) return true;
  if (isFusaoAbsorvoAlvo(r)) return true;
  return false;
}

/** @param {Record<string, unknown>} r */
function isEmAberto(r) {
  return !isResolvidoOuFundido(r);
}

/**
 * @param {object} p
 * @param {Array<Record<string, unknown>>} p.todasReclamacoes — resposta getByCpf
 * @param {Array<Record<string, unknown>>} p.outrosRegistros — exclui ocorrência em edição (criação: igual a todas)
 * @param {string} p.tipoFormulario — formData.tipo (BACEN, OUVIDORIA, …)
 * @returns {string}
 */
export function mensagemRetornoBuscaLocalizar({ todasReclamacoes, outrosRegistros, tipoFormulario }) {
  if (!Array.isArray(todasReclamacoes) || todasReclamacoes.length === 0) {
    return 'Nenhuma ocorrência encontrada';
  }
  const outros = Array.isArray(outrosRegistros) ? outrosRegistros : todasReclamacoes;
  if (outros.length === 0) {
    return 'Nenhuma ocorrência encontrada';
  }

  const tForm = normalizeTipoOcorrenciaComparacao(tipoFormulario);
  const outrosMesmoTipo = outros.filter((r) => normalizeTipoOcorrenciaComparacao(r.tipo) === tForm);
  const outrosOutroTipo = outros.filter((r) => normalizeTipoOcorrenciaComparacao(r.tipo) !== tForm);

  if (outrosMesmoTipo.some((r) => isEmAberto(r))) {
    return 'Encontrada redundância de registro.';
  }
  if (outrosMesmoTipo.length > 0) {
    return 'Encontrada ocorrência. Caso anterior encerrado.';
  }
  if (outrosOutroTipo.length > 0) {
    const tiposUnicos = [...new Set(outrosOutroTipo.map((r) => String(r.tipo || '').trim()).filter(Boolean))];
    return `Ocorrência encontrada em ${tiposUnicos.join(', ')}`;
  }
  return 'Nenhuma ocorrência encontrada';
}
