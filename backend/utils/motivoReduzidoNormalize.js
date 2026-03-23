/**
 * Padronização de texto de um item de motivoReduzido (ouvidoria)
 * VERSION: v1.2.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Padrão de grafia: Xxxxx xxxxx xxxx (apenas primeira letra da primeira palavra maiúscula).
 *
 * Regras:
 * 1) Renomeações exatas (comparação case-insensitive) → texto canônico no padrão Xxxxx xxxxx xxxx
 * 2) Demais valores: sentence case pt-BR (primeira letra maiúscula, resto minúsculo)
 */

'use strict';

/**
 * @param {string} s
 * @returns {string}
 */
function chaveComparacao(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');
}

/**
 * Mapa chave normalizada → texto canônico (padrão Xxxxx xxxxx xxxx).
 */
const RENOMEACOES_EXATAS = new Map([
  ['cobrança', 'Em cobrança'],
  ['em cobrança', 'Em cobrança'],
  ['em cobranca', 'Em cobrança'],
  ['fraude', 'Alega fraude'],
  ['alega fraude', 'Alega fraude'],
  ['erro', 'Erro app'],
  ['erro app', 'Erro app'],
  ['encerramento de conta celcoin', 'Encerramento cta celcoin'],
  ['encerramento cta celcoin', 'Encerramento cta celcoin'],
  ['lgpd', 'Encerramento cta app'],
  ['encerramento cta app', 'Encerramento cta app'],
  ['portabilidade chave pix', 'Portabilidade chave pix'],
  ['portabilidade pix', 'Portabilidade pix'],
  ['valor minimo para contratação', 'Valor minimo para contratação'],
  ['valor minimo para contrataçao', 'Valor minimo para contratação'],
  ['limite baixo do pix', 'Limite baixo do pix'],
  ['alteração cadastral', 'Alteração cadastral'],
  ['alteracao cadastral', 'Alteração cadastral'],
  ['dívida prescrita', 'Dívida prescrita'],
  ['divida prescrita', 'Dívida prescrita'],
  ['seguro acidente', 'Seguro acidente'],
  ['dúvidas sobre restituição', 'Dúvidas sobre restituição'],
  ['duvidas sobre restituição', 'Dúvidas sobre restituição'],
  ['duvidas sobre restituiçao', 'Dúvidas sobre restituição'],
  ['desativada não considerar reclamação', 'Desativada - não considerar reclamação'],
  ['desativada nao considerar reclamação', 'Desativada - não considerar reclamação'],
]);

/**
 * Padrão Xxxxx xxxxx xxxx: primeira letra maiúscula, resto minúsculo (sentence case pt-BR).
 * @param {string} s
 * @returns {string}
 */
function sentenceCasePtBR(s) {
  const t = String(s).trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const lower = t.toLocaleLowerCase('pt-BR');
  const first = lower.charAt(0).toLocaleUpperCase('pt-BR');
  return first + lower.slice(1);
}

/**
 * Normaliza um único motivo (string)
 * @param {unknown} motivo
 * @returns {string} string vazia se inválido
 */
function normalizarItemMotivoReduzido(motivo) {
  if (motivo == null || typeof motivo !== 'string') return '';
  const t = motivo.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const k = chaveComparacao(t);
  if (RENOMEACOES_EXATAS.has(k)) {
    return RENOMEACOES_EXATAS.get(k);
  }
  return sentenceCasePtBR(t);
}

/**
 * Parte string por separadores comuns de planilha / formulário
 * @param {string} str
 * @returns {string[]}
 */
function splitMotivosString(str) {
  return String(str)
    .split(/[,;\/]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Converte campo motivoReduzido (array ou string) em lista de partes brutas
 * @param {unknown} valor
 * @returns {string[]}
 */
function coercerPartesMotivo(valor) {
  if (valor == null) return [];
  if (Array.isArray(valor)) {
    return valor
      .map((x) => (x != null ? String(x).trim() : ''))
      .filter((x) => x.length > 0);
  }
  if (typeof valor === 'string') {
    return splitMotivosString(valor);
  }
  return [];
}

/**
 * Normaliza lista: map + dedupe case-insensitive preservando primeira ocorrência canônica
 * @param {string[]} partes
 * @returns {string[]}
 */
function normalizarListaPartes(partes) {
  const out = [];
  const seen = new Set();
  for (const p of partes) {
    const n = normalizarItemMotivoReduzido(p);
    if (!n) continue;
    const key = n.toLocaleLowerCase('pt-BR');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

/**
 * Converte string de célula (planilha) em array de motivos normalizados
 * @param {unknown} motivoStr
 * @returns {string[]}
 */
function normalizarMotivosDeCelula(motivoStr) {
  if (motivoStr == null || motivoStr === '') return [];
  const partes = typeof motivoStr === 'string' ? splitMotivosString(motivoStr) : coercerPartesMotivo(motivoStr);
  return normalizarListaPartes(partes);
}

/**
 * Normaliza o campo completo como armazenado no Mongo (string ou array → sempre array)
 * @param {unknown} motivoReduzido
 * @returns {{ motivos: string[], mudou: boolean }}
 */
function normalizarCampoMotivoReduzido(motivoReduzido) {
  const partes = coercerPartesMotivo(motivoReduzido);
  const motivos = normalizarListaPartes(partes);

  const serialAntes = JSON.stringify(motivoReduzido);
  const serialDepois = JSON.stringify(motivos);
  const mudou = serialAntes !== serialDepois;

  return { motivos, mudou };
}

module.exports = {
  normalizarItemMotivoReduzido,
  normalizarMotivosDeCelula,
  normalizarCampoMotivoReduzido,
  coercerPartesMotivo,
  splitMotivosString,
};
