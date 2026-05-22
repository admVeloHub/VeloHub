/**
 * VeloHub V3 — Regras Liberação chave pix (Req_Prod + Ouvidoria)
 * VERSION: v1.0.2 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.1: tipoOuvidoriaFormToOrigemReqProd: PROCESSOS/JUDICIAL → Judicial; TIME_PORTABILIDADE → Atendimento (Req_Prod)
 */

/** Chaves de booleanos redundantes quando a origem já identifica o canal (aba Liberação chave pix). */
export const LIBERACAO_PIX_ORIGEM_OCULTA_BOOLEAN = {
  'Reclame Aqui': 'reclameAqui',
  Procon: 'procon',
  'N2 Pix': 'n2Ouvidora',
  Judicial: 'processo',
  Bacen: 'bacen',
};

/** Rótulos dos checkboxes Exclusão de Chave PIX (ordem de exibição). */
export const LIBERACAO_PIX_BOOLEAN_ROWS = [
  { key: 'semDebitoAberto', label: 'Sem Débito em aberto' },
  { key: 'n2Ouvidora', label: 'N2 - Ouvidora' },
  { key: 'procon', label: 'Procon' },
  { key: 'reclameAqui', label: 'Reclame Aqui' },
  { key: 'processo', label: 'Processo' },
  { key: 'bacen', label: 'Bacen' },
  { key: 'revogadoConsentimentoEcac', label: 'Revogado consentimento ECAC' },
];

/**
 * Booleanos efetivos para validação, mensagem e API (origem implica true nos campos ocultos).
 * @param {Object} form
 * @returns {Object}
 */
export function getLiberacaoChavePixEffectiveBooleans(form) {
  const o = String(form?.origem || '').trim();
  const hiddenKey = LIBERACAO_PIX_ORIGEM_OCULTA_BOOLEAN[o];
  const implied = (k) => (hiddenKey === k ? true : form[k] === true);
  return {
    semDebitoAberto: form.semDebitoAberto === true,
    n2Ouvidora: implied('n2Ouvidora'),
    procon: implied('procon'),
    reclameAqui: implied('reclameAqui'),
    processo: implied('processo'),
    bacen: implied('bacen'),
    revogadoConsentimentoEcac: form.revogadoConsentimentoEcac === true,
  };
}

/** @param {string} origem */
export function getLiberacaoChavePixBooleanKeyOcultoPorOrigem(origem) {
  const o = String(origem || '').trim();
  return LIBERACAO_PIX_ORIGEM_OCULTA_BOOLEAN[o] || null;
}

/**
 * Valor do campo origem em liberacao_pix_prod (select Req_Prod) a partir do tipo do form Ouvidoria.
 * @param {string} tipoOuvidoria — BACEN | OUVIDORIA | RECLAME_AQUI | PROCON | …
 * @returns {string} ex.: Bacen, N2 Pix; vazio se tipo não mapeado para esse fluxo
 */
export function tipoOuvidoriaFormToOrigemReqProd(tipoOuvidoria) {
  const t = String(tipoOuvidoria || '').trim();
  if (t === 'BACEN') return 'Bacen';
  if (t === 'OUVIDORIA') return 'N2 Pix';
  if (t === 'RECLAME_AQUI') return 'Reclame Aqui';
  if (t === 'PROCON') return 'Procon';
  if (t === 'PROCESSOS' || t === 'JUDICIAL') return 'Judicial';
  if (t === 'TIME_PORTABILIDADE') return 'Atendimento';
  return '';
}
