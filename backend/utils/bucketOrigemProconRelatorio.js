/**
 * VeloHub V3 — Bucket origem Procon / Consumidor.gov.br (relatórios + dashboard)
 * VERSION: v1.0.0 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 */

/**
 * Agrupa campo `origem` em reclamacoes_procon para contagens estáveis no relatório e no dashboard.
 * @param {unknown} origemRaw
 * @returns {'Procon'|'Consumidor.gov.br'}
 */
function bucketOrigemProconRelatorio(origemRaw) {
  const t = String(origemRaw == null ? '' : origemRaw).trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t) return 'Procon';
  if (
    t === 'consumidor.gov' ||
    t.includes('consumidor.gov') ||
    (t.includes('consumidor') && t.includes('gov')) ||
    t.includes('consumidor.gov.br')
  ) {
    return 'Consumidor.gov.br';
  }
  return 'Procon';
}

module.exports = { bucketOrigemProconRelatorio };
