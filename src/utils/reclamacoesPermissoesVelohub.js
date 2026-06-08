// VERSION: v1.0.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
// Visibilidade Reclamações N1 (4 abas) vs N2 (todas as abas); retrocompat modulosVelohub.reclamacoes

/** Todas as abas do módulo Reclamações (OuvidoriaPage) */
export const RECLAMACOES_ABAS_TODAS = [
  'nova',
  'minhas',
  'lista',
  'chargeback',
  'dashboard',
  'relatorios',
  'analise-diaria',
];

/** Abas Reclamações — N1 */
export const RECLAMACOES_ABAS_N1 = ['nova', 'minhas', 'lista', 'dashboard'];

function temChaveExplicita(obj, key) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Acesso completo (todas as abas): reclamacoesN2 ou legado reclamacoes sem N1/N2 explícitos.
 * @param {object|null} perm
 */
export function reclamacoesAcessoTodasAbas(perm) {
  if (!perm || typeof perm !== 'object') return false;
  if (perm.reclamacoesN2 === true) return true;
  const hasN1 = temChaveExplicita(perm, 'reclamacoesN1');
  const hasN2 = temChaveExplicita(perm, 'reclamacoesN2');
  if (perm.reclamacoes === true && !hasN1 && !hasN2) return true;
  return false;
}

/**
 * Entrada no módulo Reclamações (nav + guard).
 * @param {object|null} perm
 */
export function reclamacoesModuloPermitido(perm) {
  if (!perm || typeof perm !== 'object') return false;
  if (reclamacoesAcessoTodasAbas(perm)) return true;
  return perm.reclamacoesN1 === true;
}

/**
 * IDs de abas visíveis no OuvidoriaPage.
 * @param {object|null} perm
 * @returns {string[]}
 */
export function abasReclamacoesPermitidas(perm) {
  if (reclamacoesAcessoTodasAbas(perm)) return [...RECLAMACOES_ABAS_TODAS];
  if (perm?.reclamacoesN1 === true) return [...RECLAMACOES_ABAS_N1];
  return [];
}
