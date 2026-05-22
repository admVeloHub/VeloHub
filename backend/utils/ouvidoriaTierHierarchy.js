/**
 * VeloHub V3 - Hierarquia de tiers Ouvidoria (fusão / CPF)
 * VERSION: v1.0.0 | DATE: 2026-04-16 | AUTHOR: VeloHub Development Team
 *
 * Ordem crescente (índice 0 = mais inferior): Time Port < N2 < Reclame Aqui < BACEN < Procon < Judicial
 */

/** @type {readonly string[]} */
const TIER_ORDER = Object.freeze([
  'TIME_PORTABILIDADE',
  'N2_PIX',
  'RECLAME_AQUI',
  'BACEN',
  'PROCON',
  'JUDICIAL',
]);

/**
 * Normaliza label de tipo vindo da API (GET) ou do formulário para chave de tier.
 * @param {string} tipo
 * @returns {string|null} uma de TIER_ORDER ou null
 */
function tipoToTierKey(tipo) {
  const t = String(tipo || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (t === 'TIME_PORTABILIDADE' || t === 'TIME PORTABILIDADE') return 'TIME_PORTABILIDADE';
  if (t === 'N2 PIX' || t === 'N2' || t === 'OUVIDORIA' || t === 'N2_PIX') return 'N2_PIX';
  if (t === 'RECLAME AQUI' || t === 'RECLAME_AQUI' || t === 'RECLAMEAQUI') return 'RECLAME_AQUI';
  if (t === 'BACEN') return 'BACEN';
  if (t === 'PROCON') return 'PROCON';
  if (t === 'AÇÃO JUDICIAL' || t === 'ACAO JUDICIAL' || t === 'PROCESSOS' || t === 'JUDICIAL') return 'JUDICIAL';

  return null;
}

/**
 * @param {string} tipo
 * @returns {number} 0..5 ou -1 se desconhecido
 */
function tierIndexFromTipo(tipo) {
  const key = tipoToTierKey(tipo);
  if (!key) return -1;
  const i = TIER_ORDER.indexOf(key);
  return i >= 0 ? i : -1;
}

/**
 * @param {string} tipoA
 * @param {string} tipoB
 * @returns {number} negativo se A inferior a B, positivo se A superior a B, 0 mesmo tier
 */
function compareTier(tipoA, tipoB) {
  return tierIndexFromTipo(tipoA) - tierIndexFromTipo(tipoB);
}

/**
 * Nome da coleção MongoDB para o tier (para buscas cross-collection).
 * @param {string} tierKey
 */
function collectionNameFromTierKey(tierKey) {
  switch (tierKey) {
    case 'TIME_PORTABILIDADE':
      return 'reclamacoes_timePortabilidade';
    case 'N2_PIX':
      return 'reclamacoes_n2Pix';
    case 'RECLAME_AQUI':
      return 'reclamacoes_reclameAqui';
    case 'BACEN':
      return 'reclamacoes_bacen';
    case 'PROCON':
      return 'reclamacoes_procon';
    case 'JUDICIAL':
      return 'reclamacoes_judicial';
    default:
      return null;
  }
}

/**
 * @param {string} collectionName nome da coleção MongoDB
 * @returns {number}
 */
function tierIndexFromCollectionName(collectionName) {
  const map = {
    reclamacoes_timePortabilidade: 0,
    reclamacoes_n2Pix: 1,
    reclamacoes_reclameAqui: 2,
    reclamacoes_bacen: 3,
    reclamacoes_procon: 4,
    reclamacoes_judicial: 5,
  };
  return map[collectionName] != null ? map[collectionName] : -1;
}

module.exports = {
  TIER_ORDER,
  tipoToTierKey,
  tierIndexFromTipo,
  compareTier,
  collectionNameFromTierKey,
  tierIndexFromCollectionName,
};
