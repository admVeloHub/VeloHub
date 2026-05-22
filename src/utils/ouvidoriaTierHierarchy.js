/**
 * VeloHub V3 - Hierarquia de tiers Ouvidoria (fusão / CPF) — espelho do backend
 * VERSION: v1.1.0 | DATE: 2026-05-06 | AUTHOR: VeloHub Development Team
 *
 * v1.1.0: `OPCOES_TIPO_RECLAMACAO_POR_HIERARQUIA` — ordem do seletor de tipo nos forms Nova/Editar (= TIER_ORDER).
 */

export const TIER_ORDER = Object.freeze([
  'TIME_PORTABILIDADE',
  'N2_PIX',
  'RECLAME_AQUI',
  'BACEN',
  'PROCON',
  'JUDICIAL',
]);

export function tipoToTierKey(tipo) {
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

export function tierIndexFromTipo(tipo) {
  const key = tipoToTierKey(tipo);
  if (!key) return -1;
  const i = TIER_ORDER.indexOf(key);
  return i >= 0 ? i : -1;
}

export function compareTier(tipoA, tipoB) {
  return tierIndexFromTipo(tipoA) - tierIndexFromTipo(tipoB);
}

/** Mapeamento tier hierárquico → opção do seletor (value = campo `tipo` da API nos forms). */
const TIER_TO_FORM_TIPO_OPCAO = {
  TIME_PORTABILIDADE: { value: 'TIME_PORTABILIDADE', label: 'Time Portabilidade' },
  N2_PIX: { value: 'OUVIDORIA', label: 'N2 Pix' },
  RECLAME_AQUI: { value: 'RECLAME_AQUI', label: 'Reclame Aqui' },
  BACEN: { value: 'BACEN', label: 'Bacen' },
  PROCON: { value: 'PROCON', label: 'Procon' },
  JUDICIAL: { value: 'PROCESSOS', label: 'Ação Judicial' },
};

/**
 * Ordem do seletor horizontal de tipo (Nova ocorrência / Editar) — igual à hierarquia `TIER_ORDER`.
 */
export const OPCOES_TIPO_RECLAMACAO_POR_HIERARQUIA = Object.freeze(
  TIER_ORDER.map((tier) => TIER_TO_FORM_TIPO_OPCAO[tier])
);
