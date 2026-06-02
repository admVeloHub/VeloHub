/**
 * VeloHub V3 — Acordeões da página Políticas e Normas (compliance + hero)
 * VERSION: v1.0.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.0: Definições compartilhadas — título, id e tipo de ciência por acordeão
 */

export const POLITICAS_NORMAS_ACCORDION_DEFS = [
  {
    id: 'codigo-etica-conduta',
    titulo: 'Código de Ética e Conduta',
    ackType: 'etica-conduta',
    defaultOpen: true,
    searchPlaceholder: 'Buscar no Código de Ética e Conduta…',
  },
];

/**
 * @param {object} item — item de compliance/pending
 * @returns {string}
 */
export function resolvePoliticasAccordionLabel(item) {
  if (!item) return '';
  if (item.accordionId) {
    const match = POLITICAS_NORMAS_ACCORDION_DEFS.find(
      (accordion) => accordion.id === item.accordionId
    );
    if (match) return match.titulo;
  }
  if (item.type === 'etica-conduta') {
    const match = POLITICAS_NORMAS_ACCORDION_DEFS.find(
      (accordion) => accordion.ackType === item.type
    );
    if (match) return match.titulo;
  }
  return item.label || '';
}
